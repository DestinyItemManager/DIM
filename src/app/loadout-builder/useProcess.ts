import { wrap, releaseProxy } from 'comlink';
import { useEffect, useState, useMemo } from 'react';
import { ItemsByBucket, LockedMap, LockedArmor2ModMap, ArmorSet } from './types';
import { DimItem } from 'app/inventory/item-types';
import { ProcessItemsByBucket, ProcessItem, ProcessArmorSet } from './processWorker/types';

type ProcessResult = null | {
  sets: ArmorSet[];
  combos: number;
  combosWithoutCaps: number;
};

type ItemsById = { [id: string]: DimItem };

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
export function useProcess(
  filteredItems: ItemsByBucket,
  lockedItems: LockedMap,
  lockedArmor2ModMap: LockedArmor2ModMap,
  selectedStoreId: string,
  assumeMasterwork: boolean
) {
  const [result, setResult] = useState(null as ProcessResult);

  const worker = useWorker();

  useEffect(() => {
    console.time('useProcess');

    setResult(null);

    console.time('useProcess: item preprocessing');
    const processItems: ProcessItemsByBucket = {};
    const itemsById: ItemsById = {};

    for (const [key, items] of Object.entries(filteredItems)) {
      processItems[key] = [];
      for (const item of items) {
        processItems[key].push(mapDimItemToProcessItem(item));
        itemsById[item.id] = item;
      }
    }

    console.timeEnd('useProcess: item preprocessing');

    worker
      .process(processItems, lockedItems, lockedArmor2ModMap, selectedStoreId, assumeMasterwork)
      .then(({ sets, combos, combosWithoutCaps }) => {
        console.time('useProcess: item hydration');
        const hydratedSets = sets.map((set) => hydrateArmorSet(set, itemsById));
        console.timeEnd('useProcess: item hydration');
        setResult({
          sets: hydratedSets,
          combos,
          combosWithoutCaps,
        });
        console.timeEnd('useProcess');
      });
  }, [
    worker,
    setResult,
    filteredItems,
    lockedItems,
    lockedArmor2ModMap,
    selectedStoreId,
    assumeMasterwork,
  ]);

  return result;
}

function useWorker() {
  const { worker, cleanup } = useMemo(() => makeWorkerApiAndCleanup(), []);

  // need to cleanup the worker when unloading
  useEffect(() => cleanup, [worker, cleanup]);

  return worker;
}

/**
 * Creates a worker, a cleanup function and returns it
 */
function makeWorkerApiAndCleanup() {
  const instance = new Worker('./processWorker/ProcessWorker', {
    name: 'ProcessWorker',
    type: 'module',
  });

  const worker = wrap<import('./processWorker/ProcessWorker').ProcessWorker>(instance);

  const cleanup = () => {
    worker[releaseProxy]();
    instance.terminate();
  };

  return { worker, cleanup };
}

function mapDimItemToProcessItem(dimItem: DimItem): ProcessItem {
  const {
    owner,
    destinyVersion,
    bucket,
    id,
    type,
    name,
    equipped,
    equippingLabel,
    basePower,
    stats,
  } = dimItem;

  if (dimItem.isDestiny2()) {
    return {
      owner,
      destinyVersion,
      bucketHash: bucket.hash,
      id,
      type,
      name,
      equipped,
      equippingLabel,
      basePower,
      stats,
      sockets: dimItem.sockets,
      energy: dimItem.energy,
    };
  }

  return {
    owner,
    destinyVersion,
    bucketHash: bucket.hash,
    id,
    type,
    name,
    equipped,
    equippingLabel,
    basePower,
    stats,
    sockets: null,
    energy: null,
  };
}

export function hydrateArmorSet(processed: ProcessArmorSet, itemsById: ItemsById): ArmorSet {
  const sets: ArmorSet['sets'] = [];

  for (const processSet of processed.sets) {
    const armor: DimItem[][] = [];

    for (const itemIds of processSet.armor) {
      armor.push(itemIds.map((id) => itemsById[id]));
    }

    sets.push({ armor, statChoices: processSet.statChoices });
  }

  const firstValidSet: DimItem[] = processed.firstValidSet.map((id) => itemsById[id]);

  return {
    sets,
    firstValidSet,
    firstValidSetStatChoices: processed.firstValidSetStatChoices,
    stats: processed.stats,
    maxPower: processed.maxPower,
  };
}
