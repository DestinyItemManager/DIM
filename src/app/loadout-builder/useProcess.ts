import { wrap, releaseProxy } from 'comlink';
import { useEffect, useState, useMemo } from 'react';
import { ItemsByBucket, LockedMap, LockedArmor2ModMap } from './types';
import { DimItem } from 'app/inventory/item-types';
import { ProcessItemsByBucket, ProcessItem, ProcessArmorSet } from './processWorker/types';

type ProcessResult = null | {
  sets: ProcessArmorSet[];
  combos: number;
  combosWithoutCaps: number;
};

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
  const [result, setResult] = useState({
    processing: false,
    result: null as ProcessResult,
  });

  const worker = useWorker();

  useEffect(() => {
    setResult({ processing: true, result: null });

    const processItems: ProcessItemsByBucket = {};

    for (const [key, items] of Object.entries(filteredItems)) {
      processItems[key] = items.map(mapDimItemToProcessItem);
    }

    worker
      .process(processItems, lockedItems, lockedArmor2ModMap, selectedStoreId, assumeMasterwork)
      .then((result) => setResult({ processing: false, result }));
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

// owner: string;
//   destinyVersion: DestinyVersion;
//   bucketHash: number;
//   hash: number;
//   type: string;
//   name: string;
//   equipped: boolean;
//   equippingLabel?: string;
//   sockets: DimSockets | null;
//   energy: DestinyItemInstanceEnergy | null;
//   basePower: number;
//   stats: DimStat[] | null;
