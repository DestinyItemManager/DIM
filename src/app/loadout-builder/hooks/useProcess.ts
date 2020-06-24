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

type ProcessResult = {
  processing: boolean;
  result: {
    sets: ArmorSet[];
    combos: number;
    combosWithoutCaps: number;
  } | null;
};

type ItemsById = { [id: string]: DimItem };

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
export function useProcess(
  filteredItems: ItemsByBucket,
  lockedItems: LockedMap,
  lockedArmor2ModMap: LockedArmor2ModMap,
  selectedStoreId: string | undefined,
  assumeMasterwork: boolean
) {
  const [{ result, processing }, setState] = useState({
    processing: false,
    result: null,
  } as ProcessResult);

  const worker = useWorker();

  useEffect(() => {
    if (selectedStoreId) {
      console.time('useProcess');

      setState({ processing: true, result });

      console.time('useProcess: item preprocessing');
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

      console.timeEnd('useProcess: item preprocessing');

      console.time('useProcess: worker time');
      worker
        .process(processItems, lockedItems, lockedArmor2ModMap, assumeMasterwork)
        .then(({ sets, combos, combosWithoutCaps }) => {
          console.timeEnd('useProcess: worker time');
          console.time('useProcess: item hydration');
          const hydratedSets = sets.map((set) => hydrateArmorSet(set, itemsById));
          console.timeEnd('useProcess: item hydration');
          setState({
            processing: false,
            result: {
              sets: hydratedSets,
              combos,
              combosWithoutCaps,
            },
          });
          console.timeEnd('useProcess');
        });
    }
    /* do not include result in dependenvies */
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [worker, filteredItems, lockedItems, lockedArmor2ModMap, selectedStoreId, assumeMasterwork]);

  return { result, processing };
}

// TODO Rather than always using the same worker maybe we should be caching the active worker so we can terminate
// it early if the user clicks something else. I think currently this may be blocked by the existing task.
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
