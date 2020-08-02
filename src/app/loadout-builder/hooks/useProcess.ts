import { wrap, releaseProxy } from 'comlink';
import _ from 'lodash';
import { useEffect, useState, useMemo } from 'react';
import {
  ItemsByBucket,
  LockedMap,
  LockedArmor2ModMap,
  ArmorSet,
  StatTypes,
  MinMaxIgnored,
  MinMax,
  LockedModBase,
  ModPickerCategories,
  bucketsToCategories,
} from '../types';
import { D2Item } from 'app/inventory/item-types';
import { ProcessItemsByBucket } from '../processWorker/types';
import {
  mapDimItemToProcessItem,
  mapSeasonalModsToProcessMods,
  getTotalModStatChanges,
  hydrateArmorSet,
  mapArmor2ModToProcessMod,
} from '../processWorker/mappers';

interface ProcessState {
  processing: boolean;
  result: {
    sets: ArmorSet[];
    combos: number;
    combosWithoutCaps: number;
    statRanges?: { [stat in StatTypes]: MinMax };
  } | null;
  currentCleanup: (() => void) | null;
}

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
export function useProcess(
  filteredItems: ItemsByBucket,
  lockedItems: LockedMap,
  lockedSeasonalMods: readonly LockedModBase[],
  lockedArmor2ModMap: LockedArmor2ModMap,
  assumeMasterwork: boolean,
  statOrder: StatTypes[],
  statFilters: { [statType in StatTypes]: MinMaxIgnored },
  minimumPower: number
) {
  const [{ result, processing, currentCleanup }, setState] = useState({
    processing: false,
    result: null,
    currentCleanup: null,
  } as ProcessState);

  const { worker, cleanup } = useWorkerAndCleanup(
    filteredItems,
    lockedItems,
    lockedSeasonalMods,
    lockedArmor2ModMap,
    assumeMasterwork,
    statOrder,
    statFilters,
    minimumPower
  );

  if (currentCleanup && currentCleanup !== cleanup) {
    currentCleanup();
  }

  useEffect(() => {
    const processStart = performance.now();

    setState({ processing: true, result, currentCleanup: cleanup });

    const processItems: ProcessItemsByBucket = {};
    const itemsById: { [id: string]: D2Item } = {};

    for (const [key, items] of Object.entries(filteredItems)) {
      processItems[key] = [];
      for (const item of items) {
        if (item.isDestiny2()) {
          processItems[key].push(
            mapDimItemToProcessItem(item, lockedArmor2ModMap[bucketsToCategories[item.bucket.hash]])
          );
          itemsById[item.id] = item;
        }
      }
    }

    const workerStart = performance.now();
    worker
      .process(
        processItems,
        lockedItems,
        mapSeasonalModsToProcessMods(lockedSeasonalMods),
        getTotalModStatChanges(
          $featureFlags.armor2ModPicker
            ? [...lockedArmor2ModMap[ModPickerCategories.general], ...lockedArmor2ModMap.seasonal]
            : lockedSeasonalMods
        ),
        _.mapValues(lockedArmor2ModMap, (mods) => mods.map((mod) => mapArmor2ModToProcessMod(mod))),
        assumeMasterwork,
        statOrder,
        statFilters,
        minimumPower
      )
      .then(({ sets, combos, combosWithoutCaps, statRanges }) => {
        console.log(`useProcess: worker time ${performance.now() - workerStart}ms`);
        const hydratedSets = sets.map((set) => hydrateArmorSet(set, itemsById));

        setState({
          processing: false,
          result: {
            sets: hydratedSets,
            combos,
            combosWithoutCaps,
            statRanges,
          },
          currentCleanup: null,
        });

        console.log(`useProcess ${performance.now() - processStart}ms`);
      });
    /* do not include things from state or worker in dependencies */
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [
    filteredItems,
    lockedItems,
    lockedSeasonalMods,
    lockedArmor2ModMap,
    assumeMasterwork,
    statOrder,
    statFilters,
    minimumPower,
  ]);

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
  lockedSeasonalMods: readonly LockedModBase[],
  lockedArmor2ModMap: LockedArmor2ModMap,
  assumeMasterwork: boolean,
  statOrder: StatTypes[],
  statFilters: { [statType in StatTypes]: MinMaxIgnored },
  minimumPower: number
) {
  const { worker, cleanup } = useMemo(() => createWorker(), [
    filteredItems,
    lockedItems,
    lockedSeasonalMods,
    lockedArmor2ModMap,
    assumeMasterwork,
    statOrder,
    statFilters,
    minimumPower,
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
