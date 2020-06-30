import { wrap, releaseProxy } from 'comlink';
import { useEffect, useState, useMemo } from 'react';
import { ItemsByBucket, LockedMap, LockedArmor2ModMap, ArmorSet } from '../types';
import { DimItem, DimSocket, DimSockets, D2Item } from 'app/inventory/item-types';
import {
  ProcessItemsByBucket,
  ProcessItem,
  ProcessArmorSet,
  ProcessSocket,
  ProcessSockets,
} from '../processWorker/types';

interface ProcessState {
  processing: boolean;
  result: {
    sets: ArmorSet[];
    combos: number;
    combosWithoutCaps: number;
  } | null;
  currentCleanup: (() => void) | null;
}

type ItemsById = { [id: string]: DimItem };

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
export function useProcess(
  filteredItems: ItemsByBucket,
  lockedItems: LockedMap,
  lockedArmor2ModMap: LockedArmor2ModMap,
  assumeMasterwork: boolean
) {
  const [{ result, processing, currentCleanup }, setState] = useState({
    processing: false,
    result: null,
    currentCleanup: null,
  } as ProcessState);

  const { worker, cleanup } = useWorkerAndCleanup(
    filteredItems,
    lockedItems,
    lockedArmor2ModMap,
    assumeMasterwork
  );

  if (currentCleanup && currentCleanup !== cleanup) {
    currentCleanup();
  }

  useEffect(() => {
    const processStart = performance.now();

    setState({ processing: true, result, currentCleanup: cleanup });

    const processItems: ProcessItemsByBucket = {};
    const itemsById: ItemsById = {};

    for (const [key, items] of Object.entries(filteredItems)) {
      processItems[key] = [];
      for (const item of items) {
        if (item.isDestiny2()) {
          processItems[key].push(mapDimItemToProcessItem(item));
          itemsById[item.id] = item;
        }
      }
    }

    const workerStart = performance.now();
    worker
      .process(processItems, lockedItems, lockedArmor2ModMap, assumeMasterwork)
      .then(({ sets, combos, combosWithoutCaps }) => {
        console.log(`useProcess: worker time ${performance.now() - workerStart}ms`);
        const hydratedSets = sets.map((set) => hydrateArmorSet(set, itemsById));

        setState({
          processing: false,
          result: {
            sets: hydratedSets,
            combos,
            combosWithoutCaps,
          },
          currentCleanup: null,
        });

        console.log(`useProcess ${performance.now() - processStart}ms`);
      });
    /* do not include things from state or worker in dependencies */
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [filteredItems, lockedItems, lockedArmor2ModMap, assumeMasterwork]);

  return { result, processing };
}

/**
 * Creates a worker and a cleanup function for the worker.
 *
 * The worker and cleanup are memoized so that when the any of the inputs are changed a new one is created.
 *
 * The worker will be cleaned up when the component unmounts.
 */
function useWorkerAndCleanup(
  filteredItems: ItemsByBucket,
  lockedItems: LockedMap,
  lockedArmor2ModMap: LockedArmor2ModMap,
  assumeMasterwork: boolean
) {
  const { worker, cleanup } = useMemo(() => createWorker(), [
    filteredItems,
    lockedItems,
    lockedArmor2ModMap,
    assumeMasterwork,
  ]);

  // cleanup the worker on unmount
  useEffect(() => cleanup, [worker, cleanup]);

  return { worker, cleanup };
}

function createWorker() {
  const instance = new Worker('../processWorker/ProcessWorker', {
    name: 'ProcessWorker',
    type: 'module',
  });

  const worker = wrap<import('../processWorker/ProcessWorker').ProcessWorker>(instance);

  const cleanup = () => {
    worker[releaseProxy]();
    instance.terminate();
  };

  return { worker, cleanup };
}

function mapDimSocketToProcessSocket(dimSocket: DimSocket): ProcessSocket {
  return {
    plug: dimSocket.plug && {
      stats: dimSocket.plug.stats,
      plugItemHash: dimSocket.plug.plugItem.hash,
    },
    plugOptions: dimSocket.plugOptions.map((dimPlug) => ({
      stats: dimPlug.stats,
      plugItemHash: dimPlug.plugItem.hash,
    })),
  };
}

function mapDimSocketsToProcessSockets(dimSockets: DimSockets): ProcessSockets {
  return {
    sockets: dimSockets.sockets.map(mapDimSocketToProcessSocket),
    categories: dimSockets.categories.map((category) => ({
      categoryStyle: category.category.categoryStyle,
      sockets: category.sockets.map(mapDimSocketToProcessSocket),
    })),
  };
}

function mapDimItemToProcessItem(dimItem: D2Item): ProcessItem {
  const { bucket, id, type, name, equippingLabel, basePower, stats } = dimItem;

  const statMap: { [statHash: number]: number } = {};
  if (stats) {
    for (const { statHash, value } of stats) {
      statMap[statHash] = value;
    }
  }

  return {
    bucketHash: bucket.hash,
    id,
    type,
    name,
    equippingLabel,
    basePower,
    stats: statMap,
    sockets: dimItem.sockets && mapDimSocketsToProcessSockets(dimItem.sockets),
    hasEnergy: Boolean(dimItem.energy),
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
