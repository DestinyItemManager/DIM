import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { mapValues } from 'app/utils/collections';
import { releaseProxy, wrap } from 'comlink';
import { BucketHashes } from 'data/d2/generated-enums';
import { deepEqual } from 'fast-equals';
import type { ProcessInputs } from '../process-worker/process';
import { ProcessItem, ProcessItemsByBucket, ProcessResult } from '../process-worker/types';
import {
  ArmorBucketHash,
  ArmorEnergyRules,
  ArmorSet,
  AutoModDefs,
  DesiredStatRange,
  ItemsByBucket,
  ModStatChanges,
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
      resultPromise: Promise<
        Omit<ProcessResult, 'sets'> & { sets: ArmorSet[]; processTime: number }
      >;
      input: ProcessInputs;
    }
  | undefined {
  const processStart = performance.now();
  const { worker, cleanup: cleanupWorker } = createWorker();
  let cleanupRef: (() => void) | undefined = cleanupWorker;
  const cleanup = () => {
    cleanupRef?.();
    cleanupRef = undefined;
  };

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

  return {
    cleanup,
    input,
    resultPromise: new Promise((resolve) => {
      worker
        .process(input)
        .then((result) => {
          const hydratedSets = result.sets.map((set) => hydrateArmorSet(set, itemsById));
          const processTime = performance.now() - processStart;
          resolve({ ...result, sets: hydratedSets, processTime });
        })
        // Cleanup the worker, we don't need it anymore.
        .finally(() => {
          cleanup();
        });
    }),
  };
}
