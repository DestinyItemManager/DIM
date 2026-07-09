import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { armorStats } from 'app/search/d2-known-values';
import { mapValues } from 'app/utils/collections';
import { getMaxParallelCores } from 'app/utils/parallel-cores';
import { proxy, releaseProxy, wrap } from 'comlink';
import { BucketHashes } from 'data/d2/generated-enums';
import { maxBy } from 'es-toolkit';
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
  AutoModDefs,
  DesiredStatRange,
  ItemsByBucket,
  ModStatChanges,
  StatRanges,
} from '../types';
import { mapArmor2ModToProcessMod, mapAutoMods, mapDimItemToProcessItems } from './mappers';

interface MappedItem {
  dimItem: DimItem;
  processItem: ProcessItem;
}

function createWorker() {
  const instance = new Worker(
    /* webpackChunkName: "lo-worker" */ new URL('../process-worker/ProcessWorker', import.meta.url),
    { type: 'module' },
  );

  const worker = wrap<import('../process-worker/ProcessWorker').ProcessWorker>(instance);

  const cleanup = () => {
    worker[releaseProxy]();
    instance.terminate();
  };

  return { worker, cleanup, uses: 0 };
}

type PooledWorker = ReturnType<typeof createWorker>;

// Retire a warm worker after this many runs and let the next acquire spin up a
// fresh one. Bounds any slow accumulation across a long session (e.g. comlink
// callback proxies) at a negligible cost — one spin-up per this many runs.
const WORKER_MAX_USES = 50;

// Creating a worker spawns a thread and parses the worker bundle — tens of ms
// that used to be paid on every run, and which now dominate the wall clock for
// searches whose compute is only a few ms. Workers are stateless between runs
// (process() takes all its input each call), so keep a warm pool: a worker
// returns to the pool when its run finishes cleanly, and is only terminated when
// a run is cancelled (so its stale work stops) or errors (so a broken worker is
// never reused).
const idleWorkers: PooledWorker[] = [];
let warmPoolLimit = 0;

function acquireWorker(): PooledWorker {
  return idleWorkers.pop() ?? createWorker();
}

function releaseWorker(pooled: PooledWorker) {
  pooled.uses++;
  if (idleWorkers.length < warmPoolLimit && pooled.uses < WORKER_MAX_USES) {
    idleWorkers.push(pooled);
  } else {
    pooled.cleanup();
  }
}

export type RunProcessResult = Omit<ProcessResult, 'sets'> & {
  sets: ProcessArmorSet[];
  processTime: number;
};

export function runProcess({
  autoModDefs,
  filteredItems,
  setBonuses,
  perks,
  lockedModMap,
  modStatChanges,
  armorEnergyRules,
  desiredStatRanges,
  anyExotic,
  autoStatMods,
  strictUpgrades,
  stopOnFirstSet,
  lastInput,
  onProgress,
}: {
  autoModDefs: AutoModDefs;
  filteredItems: ItemsByBucket;
  setBonuses: SetBonusCounts;
  perks: number[];
  lockedModMap: ModMap;
  modStatChanges: ModStatChanges;
  armorEnergyRules: ArmorEnergyRules;
  desiredStatRanges: DesiredStatRange[];
  anyExotic: boolean;
  autoStatMods: boolean;
  strictUpgrades: boolean;
  stopOnFirstSet: boolean;
  lastInput: ProcessInputs | undefined;
  onProgress?: (completed: number, total: number) => void;
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
  for (const [bucketHashStr, items] of Object.entries(filteredItems)) {
    const bucketHash: ArmorBucketHash = parseInt(bucketHashStr, 10);
    processItems[bucketHash] = [];

    const mappedItems: MappedItem[] = items.flatMap((dimItem) =>
      mapDimItemToProcessItems({
        dimItem,
        armorEnergyRules,
        desiredStatRanges,
        modsForSlot: bucketSpecificMods[bucketHash] || [],
        autoStatMods,
      }).map((processItem) => ({
        dimItem,
        processItem,
      })),
    );

    for (const mappedItem of mappedItems) {
      processItems[bucketHash].push(mappedItem.processItem);
    }
  }

  // Convert the flat perks array (with duplicates) into a counted map
  const perkCountMap = new Map<number, number>();
  for (const hash of perks) {
    perkCountMap.set(hash, (perkCountMap.get(hash) ?? 0) + 1);
  }
  const requiredPerks = Array.from(perkCountMap, ([hash, count]) => ({ hash, count }));

  const input: ProcessInputs = {
    filteredItems: processItems,
    modStatTotals: mapValues(modStatChanges, (stat) => stat.value),
    lockedMods: lockedProcessMods,
    setBonuses,
    requiredPerks,
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
  const concurrency = getMaxParallelCores();

  const longestItemsBucketHash = Number(
    maxBy(Object.entries(processItems), ([, items]) => items.length)![0],
  );
  const inputSlices = sliceInputForConcurrency(input, longestItemsBucketHash, concurrency);

  let progressTotal = 0;
  warmPoolLimit = concurrency;

  for (let i = 0; i < inputSlices.length; i++) {
    const pooled = acquireWorker();
    const input = inputSlices[i];
    // `settled` guards the one-time disposition of this worker — whichever of
    // completion, error, or cancellation happens first wins.
    let settled = false;
    const handleProgress = proxy((completed: number) => {
      if (settled) {
        return;
      }
      progressTotal += completed;
      onProgress?.(progressTotal, numCombinations);
    });
    const existingCleanup = cleanup;
    // Cancellation (a newer run supersedes this one): terminate so the stale
    // computation stops, and don't return the worker to the pool.
    const cancel = () => {
      if (settled) {
        return;
      }
      settled = true;
      pooled.cleanup();
    };
    cleanup = () => {
      existingCleanup();
      cancel();
    };
    const workerPromise = (async () => {
      try {
        const result = await pooled.worker.process(i + 1, input, handleProgress);
        // Clean completion: hand the warm worker back for the next run.
        if (!settled) {
          settled = true;
          releaseWorker(pooled);
        }
        return result;
      } catch (e) {
        // Error (or the reject from a cancel-driven terminate): never pool it.
        if (!settled) {
          settled = true;
          pooled.cleanup();
        }
        throw e;
      }
    })();
    workerPromises.push(workerPromise);
  }

  return {
    cleanup,
    input,
    resultPromise: Promise.all(workerPromises).then((results) => {
      const result = combineResults(results);
      const processTime = performance.now() - processStart;
      return { ...result, processTime };
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
  a.statistics.skipReasons.insufficientPerks += b.statistics.skipReasons.insufficientPerks;
  a.statistics.skipReasons.noExotic += b.statistics.skipReasons.noExotic;
  a.statistics.skipReasons.skippedLowTier += b.statistics.skipReasons.skippedLowTier;
  return a;
}

function sliceInputForConcurrency(
  input: ProcessInputs,
  longestItemsBucketHash: ArmorBucketHash,
  concurrency: number,
) {
  if (concurrency <= 1) {
    return [input];
  }

  const itemsToSlice = input.filteredItems[longestItemsBucketHash];
  if (itemsToSlice.length <= 1) {
    return [input];
  }

  // Each worker runs an independent search with its own top-N tracker, and how
  // hard it can prune depends on how good the items it holds are. Contiguous
  // slices would hand one worker all the best items and another all the worst,
  // so the workers finish at very different times and the weak ones prune
  // poorly. Instead, sort the sliced bucket high-stat-first (the order the
  // worker itself uses) and deal the items round-robin, so every worker gets a
  // stratified spread and their trackers — and runtimes — stay comparable.
  const enabledStatHashes = input.desiredStatRanges
    .filter((r) => r.maxStat > 0)
    .map((r) => r.statHash);
  const enabledTotal = (item: ProcessItem) => {
    let total = 0;
    for (const statHash of enabledStatHashes) {
      total += item.stats[statHash] ?? 0;
    }
    return total;
  };
  const sorted = [...itemsToSlice].sort((a, b) => enabledTotal(b) - enabledTotal(a));
  const count = Math.min(concurrency, sorted.length);
  const slices: ProcessItem[][] = Array.from({ length: count }, () => []);
  for (let i = 0; i < sorted.length; i++) {
    slices[i % count].push(sorted[i]);
  }

  return slices.map((itemsSlice) => ({
    ...input,
    filteredItems: {
      ...input.filteredItems,
      [longestItemsBucketHash]: itemsSlice,
    },
  }));
}
