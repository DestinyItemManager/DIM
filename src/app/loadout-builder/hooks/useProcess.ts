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
  bucketsToCategories,
  ModPickerCategories,
  statHashes,
} from '../types';
import { DimItem } from 'app/inventory/item-types';
import { ProcessItemsByBucket } from '../processWorker/types';
import {
  mapDimItemToProcessItem,
  mapSeasonalModsToProcessMods,
  getTotalModStatChanges,
  hydrateArmorSet,
  mapArmor2ModToProcessMod,
} from '../processWorker/mappers';
import { getSpecialtySocketMetadata } from 'app/utils/item-utils';
import { someModHasEnergyRequirement } from '../utils';

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
    const itemsById: { [id: string]: DimItem[] } = {};

    for (const [key, items] of Object.entries(filteredItems)) {
      processItems[key] = [];
      const groupedItems = groupItems(
        items,
        lockedSeasonalMods,
        lockedArmor2ModMap,
        statOrder,
        assumeMasterwork
      );
      for (const group of Object.values(groupedItems)) {
        const item = group.length ? group[0] : null;
        if (item?.isDestiny2()) {
          processItems[key].push(
            mapDimItemToProcessItem(item, lockedArmor2ModMap[bucketsToCategories[item.bucket.hash]])
          );
          itemsById[item.id] = group;
        }
      }
    }

    const workerStart = performance.now();
    worker
      .process(
        processItems,
        mapSeasonalModsToProcessMods(lockedSeasonalMods),
        getTotalModStatChanges(lockedItems, lockedArmor2ModMap),
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

/**
 * This groups items for process depending on whether any general or seasonal mods are locked as follows
 * - If there are general or seasonal mods locked it groups items by (stats, masterworked, modSlot, energyType).
 * - If there are only general mods locked it groupes items by (stats, masterwork, energyType)
 * - If no general or seasonal mods are locked it groups by (stats, masterworked).
 *
 * Note that assumedMasterwork effects this.
 */
function groupItems(
  items: readonly DimItem[],
  lockedSeasonalMods: readonly LockedModBase[],
  lockedArmor2ModMap: LockedArmor2ModMap,
  statOrder: StatTypes[],
  assumeMasterwork: boolean
) {
  const groupingFn = (item: DimItem) => {
    if (item.isDestiny2()) {
      const statValues: number[] = [];
      const statsByHash = item.stats && _.keyBy(item.stats, (s) => s.statHash);
      // Ensure ordering of stats
      if (statsByHash) {
        for (const statType of statOrder) {
          statValues.push(statsByHash[statHashes[statType]].base);
        }
      }

      let groupId = `${statValues}${assumeMasterwork || item.energy?.energyCapacity === 10}`;

      if (lockedSeasonalMods.length || lockedArmor2ModMap[ModPickerCategories.seasonal].length) {
        groupId += `${getSpecialtySocketMetadata(item)?.season}`;
      } else if (
        someModHasEnergyRequirement(lockedSeasonalMods) ||
        someModHasEnergyRequirement(lockedArmor2ModMap[ModPickerCategories.seasonal]) ||
        someModHasEnergyRequirement(lockedArmor2ModMap[ModPickerCategories.general])
      ) {
        groupId += `${item.energy?.energyType}`;
      }
      return groupId;
    } else {
      return 'throwAway';
    }
  };

  return _.groupBy(items, groupingFn);
}
