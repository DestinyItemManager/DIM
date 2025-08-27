import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { armorStats } from 'app/search/d2-known-values';
import { mapValues } from 'app/utils/collections';
import { releaseProxy, wrap } from 'comlink';
import { BucketHashes } from 'data/d2/generated-enums';
import { chunk, maxBy } from 'es-toolkit';
import { deepEqual } from 'fast-equals';
import type { ProcessInputs } from '../process-worker/process';
import { HeapSetTracker } from '../process-worker/set-tracker';
import {
  ProcessArmorSet,
  ProcessItem,
  ProcessItemsByBucket,
  ProcessResult,
  ProcessStatistics,
} from '../process-worker/types';
import {
  ArmorBucketHash,
  ArmorEnergyRules,
  ArmorSet,
  AutoModDefs,
  DesiredStatRange,
  ItemsByBucket,
  ModStatChanges,
  StatRanges,
} from '../types';
import {
  hydrateArmorSet,
  mapArmor2ModToProcessMod,
  mapAutoMods,
  mapDimItemToProcessItem,
} from './mappers';

interface MappedItem {
  dimItem: DimItem;
  processItem: ProcessItem;
}

function createWorker() {
  const instance = new Worker(
    /* webpackChunkName: "lo-worker" */ new URL('../process-worker/ProcessWorker', import.meta.url),
  );

  const worker = wrap<import('../process-worker/ProcessWorker').ProcessWorker>(instance);

  const cleanup = () => {
    worker[releaseProxy]();
    instance.terminate();
  };

  return { worker, cleanup };
}

export type RunProcessResult = Omit<ProcessResult, 'sets'> & {
  sets: ArmorSet[];
  processTime: number;
};

export function runProcess({
  autoModDefs,
  filteredItems,
  setBonuses,
  lockedModMap,
  modStatChanges,
  armorEnergyRules,
  desiredStatRanges,
  anyExotic,
  autoStatMods,
  strictUpgrades,
  stopOnFirstSet,
  lastInput,
}: {
  autoModDefs: AutoModDefs;
  filteredItems: ItemsByBucket;
  setBonuses: SetBonusCounts;
  lockedModMap: ModMap;
  modStatChanges: ModStatChanges;
  armorEnergyRules: ArmorEnergyRules;
  desiredStatRanges: DesiredStatRange[];
  anyExotic: boolean;
  autoStatMods: boolean;
  strictUpgrades: boolean;
  stopOnFirstSet: boolean;
  lastInput: ProcessInputs | undefined;
}):
  | {
      cleanup: () => void;
      resultPromise: Promise<RunProcessResult>;
      input: ProcessInputs;
    }
  | undefined {
  const processStart = performance.now();
  const { bucketSpecificMods, activityMods, generalMods } = lockedModMap;

  const lockedProcessMods = {
    generalMods: generalMods.map(mapArmor2ModToProcessMod),
    activityMods: activityMods.map(mapArmor2ModToProcessMod),
  };

  const autoModsData = mapAutoMods(autoModDefs);

  const processItems: ProcessItemsByBucket = {
    [BucketHashes.Helmet]: [],
    [BucketHashes.Gauntlets]: [],
    [BucketHashes.ChestArmor]: [],
    [BucketHashes.LegArmor]: [],
    [BucketHashes.ClassArmor]: [],
  };
  const itemsById = new Map<string, DimItem>();

  for (const [bucketHashStr, items] of Object.entries(filteredItems)) {
    const bucketHash = parseInt(bucketHashStr, 10) as ArmorBucketHash;
    processItems[bucketHash] = [];

    const mappedItems: MappedItem[] = items.map((dimItem) => ({
      dimItem,
      processItem: mapDimItemToProcessItem({
        dimItem,
        armorEnergyRules,
        modsForSlot: bucketSpecificMods[bucketHash] || [],
      }),
    }));

    for (const mappedItem of mappedItems) {
      processItems[bucketHash].push(mappedItem.processItem);
      itemsById.set(mappedItem.dimItem.id, mappedItem.dimItem);
    }
  }

  // TODO: could potentially partition the problem (split the largest item category maybe) to spread across more cores
  const input: ProcessInputs = {
    filteredItems: processItems,
    modStatTotals: mapValues(modStatChanges, (stat) => stat.value),
    lockedMods: lockedProcessMods,
    setBonuses,
    desiredStatRanges,
    anyExotic,
    autoModOptions: autoModsData,
    autoStatMods,
    strictUpgrades,
    stopOnFirstSet,
  };
  if (deepEqual(lastInput, input)) {
    // If the inputs are the same as last time, we can skip the worker and just
    // return the last result.
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let cleanup = () => {};
  const workerPromises: Promise<ProcessResult>[] = [];

  const numCombinations = Object.values(processItems).reduce(
    (total, items) => total * Math.max(1, items.length),
    1,
  );
  const concurrency = Math.max(
    1,
    // Don't spin up a ton of threads for small problems
    Math.min(navigator.hardwareConcurrency || 1, Math.ceil(numCombinations / 100000)),
  );

  const longestItemsBucketHash = Number(
    maxBy(Object.entries(processItems), ([, items]) => items.length)![0],
  );
  const inputSlices = sliceInputForConcurrency(input, longestItemsBucketHash, concurrency);

  for (let i = 0; i < inputSlices.length; i++) {
    const { worker, cleanup: cleanupWorker } = createWorker();
    let cleanupRef: (() => void) | undefined = cleanupWorker;
    const existingCleanup = cleanup;
    const cleanupThisWorker = () => {
      cleanupRef?.();
      cleanupRef = undefined;
    };
    cleanup = () => {
      existingCleanup();
      cleanupThisWorker();
    };
    const input = inputSlices[i];
    const workerPromise = (async () => {
      try {
        return await worker.process(i + 1, input);
      } finally {
        cleanupThisWorker();
      }
    })();
    workerPromises.push(workerPromise);
  }

  return {
    cleanup,
    input,
    resultPromise: Promise.all(workerPromises).then((results) => {
      const result = combineResults(results);
      const hydratedSets = result.sets.map((set) => hydrateArmorSet(set, itemsById));
      const processTime = performance.now() - processStart;
      return { ...result, sets: hydratedSets, processTime };
    }),
  };
}
function combineResults(results: ProcessResult[]): ProcessResult {
  if (results.length === 1) {
    return results[0];
  }

  const setTracker = new HeapSetTracker<ProcessArmorSet>(200);
  for (const result of results) {
    for (const set of result.sets) {
      if (setTracker.couldInsert(set.enabledStatsTotal)) {
        setTracker.insert(set);
      }
    }
  }
  const topSets = setTracker.getArmorSets();

  const firstResult = results.shift()!;
  return results.reduce(
    (combined, result) => ({
      sets: topSets,
      combos: combined.combos + result.combos,
      statRangesFiltered: combineStatRanges(combined.statRangesFiltered, result.statRangesFiltered),
      processInfo: combineProcessInfo(combined.processInfo, result.processInfo),
    }),
    firstResult,
  );
}

function combineStatRanges(a: StatRanges, b: StatRanges): StatRanges {
  for (const statHash of armorStats) {
    const range = a[statHash];
    range.maxStat = Math.max(range.maxStat, b[statHash].maxStat);
    range.minStat = Math.min(range.minStat, b[statHash].minStat);
  }
  return a;
}

function combineProcessInfo(a: ProcessStatistics, b: ProcessStatistics): ProcessStatistics {
  a.numProcessed += b.numProcessed;
  a.numValidSets += b.numValidSets;
  a.statistics.lowerBoundsExceeded.timesChecked += b.statistics.lowerBoundsExceeded.timesChecked;
  a.statistics.lowerBoundsExceeded.timesFailed += b.statistics.lowerBoundsExceeded.timesFailed;
  a.statistics.modsStatistics.autoModsPick.timesChecked +=
    b.statistics.modsStatistics.autoModsPick.timesChecked;
  a.statistics.modsStatistics.autoModsPick.timesFailed +=
    b.statistics.modsStatistics.autoModsPick.timesFailed;
  a.statistics.modsStatistics.earlyModsCheck.timesChecked +=
    b.statistics.modsStatistics.earlyModsCheck.timesChecked;
  a.statistics.modsStatistics.earlyModsCheck.timesFailed +=
    b.statistics.modsStatistics.earlyModsCheck.timesFailed;
  a.statistics.modsStatistics.finalAssignment.autoModsAssignmentFailed +=
    b.statistics.modsStatistics.finalAssignment.autoModsAssignmentFailed;
  a.statistics.modsStatistics.finalAssignment.modAssignmentAttempted +=
    b.statistics.modsStatistics.finalAssignment.modAssignmentAttempted;
  a.statistics.modsStatistics.finalAssignment.modsAssignmentFailed +=
    b.statistics.modsStatistics.finalAssignment.modsAssignmentFailed;
  a.statistics.skipReasons.doubleExotic += b.statistics.skipReasons.doubleExotic;
  a.statistics.skipReasons.insufficientSetBonus += b.statistics.skipReasons.insufficientSetBonus;
  a.statistics.skipReasons.noExotic += b.statistics.skipReasons.noExotic;
  a.statistics.skipReasons.skippedLowTier += b.statistics.skipReasons.skippedLowTier;
  return a;
}

function sliceInputForConcurrency(
  input: ProcessInputs,
  longestItemsBucketHash: number,
  concurrency: number,
) {
  if (concurrency <= 1) {
    return [input];
  }

  const itemsToSlice = input.filteredItems[longestItemsBucketHash as ArmorBucketHash];
  if (itemsToSlice.length <= 1) {
    return [input];
  }

  const sliceSize = Math.ceil(itemsToSlice.length / concurrency);
  return chunk(itemsToSlice, sliceSize).map((itemsSlice) => ({
    ...input,
    filteredItems: {
      ...input.filteredItems,
      [longestItemsBucketHash]: itemsSlice,
    },
  }));
}
