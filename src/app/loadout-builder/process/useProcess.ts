import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import { getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { releaseProxy, wrap } from 'comlink';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { someModHasEnergyRequirement } from '../mod-utils';
import { ProcessItemsByBucket } from '../process-worker/types';
import {
  ArmorSet,
  bucketsToCategories,
  ItemsByBucket,
  LockedMap,
  LockedMod,
  LockedMods,
  MinMax,
  MinMaxIgnored,
  statHashes,
  StatTypes,
} from '../types';
import {
  getTotalModStatChanges,
  hydrateArmorSet,
  mapArmor2ModToProcessMod,
  mapDimItemToProcessItem,
} from './mappers';

interface ProcessState {
  processing: boolean;
  resultStoreId?: string;
  result: {
    sets: ArmorSet[];
    combos: number;
    combosWithoutCaps: number;
    statRanges?: { [stat in StatTypes]: MinMax };
  } | null;
}

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
// TODO: introduce params object
export function useProcess(
  selectedStore: DimStore<DimItem> | undefined,
  filteredItems: ItemsByBucket,
  lockedItems: LockedMap,
  lockedModMap: LockedMods,
  assumeMasterwork: boolean,
  statOrder: StatTypes[],
  statFilters: { [statType in StatTypes]: MinMaxIgnored }
) {
  const [{ result, processing }, setState] = useState<ProcessState>({
    processing: false,
    resultStoreId: selectedStore?.id,
    result: null,
  });

  const cleanupRef = useRef<(() => void) | null>();

  // Cleanup worker on unmount
  useEffect(
    () => () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    const processStart = performance.now();

    // Stop any previous worker
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const { worker, cleanup } = createWorker();
    cleanupRef.current = cleanup;

    setState((state) => ({
      processing: true,
      resultStoreId: selectedStore?.id,
      result: selectedStore?.id === state.resultStoreId ? state.result : null,
      currentCleanup: cleanup,
    }));

    const generalMods = lockedModMap[armor2PlugCategoryHashesByName.general] || [];
    const raidCombatAndLegacyMods = Object.entries(
      lockedModMap
    ).flatMap(([plugCategoryHash, mods]) =>
      mods && !armor2PlugCategoryHashes.includes(Number(plugCategoryHash)) ? mods : []
    );

    const processItems: ProcessItemsByBucket = {};
    const itemsById = new Map<string, DimItem[]>();

    for (const [key, items] of Object.entries(filteredItems)) {
      processItems[key] = [];

      const groupedItems = groupItems(
        items,
        statOrder,
        assumeMasterwork,
        generalMods,
        raidCombatAndLegacyMods
      );

      for (const group of Object.values(groupedItems)) {
        const item = group.length ? group[0] : null;

        if (item) {
          processItems[key].push(
            mapDimItemToProcessItem(item, lockedModMap[bucketsToCategories[item.bucket.hash]])
          );
          itemsById.set(item.id, group);
        }
      }
    }

    const lockedProcessMods = _.mapValues(
      lockedModMap,
      (mods) => mods?.map((mod) => mapArmor2ModToProcessMod(mod)) || []
    );

    // TODO: could potentially partition the problem (split the largest item category maybe) to spread across more cores
    const workerStart = performance.now();
    worker
      .process(
        processItems,
        getTotalModStatChanges(lockedModMap, selectedStore?.classType),
        lockedProcessMods,
        assumeMasterwork,
        statOrder,
        statFilters
      )
      .then(({ sets, combos, combosWithoutCaps, statRanges }) => {
        infoLog(
          'loadout optimizer',
          `useProcess: worker time ${performance.now() - workerStart}ms`
        );
        const hydratedSets = sets.map((set) => hydrateArmorSet(set, itemsById));

        setState((oldState) => ({
          ...oldState,
          processing: false,
          result: {
            sets: hydratedSets,
            combos,
            combosWithoutCaps,
            statRanges,
          },
        }));

        infoLog('loadout optimizer', `useProcess ${performance.now() - processStart}ms`);
      })
      // Cleanup the worker, we don't need it anymore.
      .finally(() => {
        cleanup();
        cleanupRef.current = null;
      });
  }, [
    filteredItems,
    lockedItems,
    lockedModMap,
    assumeMasterwork,
    statOrder,
    statFilters,
    selectedStore,
  ]);

  return { result, processing };
}

function createWorker() {
  const instance = new Worker(new URL('../process-worker/ProcessWorker', import.meta.url));

  const worker = wrap<import('../process-worker/ProcessWorker').ProcessWorker>(instance);

  const cleanup = () => {
    worker[releaseProxy]();
    instance.terminate();
  };

  return { worker, cleanup };
}

/**
 * This groups items for process depending on whether any general, other or raid mods are locked as follows
 * - If there are general, other or raid mods locked it groups items by (stats, masterworked, modSlot, energyType).
 * - If there are only general mods locked it groupes items by (stats, masterwork, energyType)
 * - If no general, other or raid mods are locked it groups by (stats, masterworked).
 *
 * Note that assumedMasterwork effects this.
 */
function groupItems(
  items: readonly DimItem[],
  statOrder: StatTypes[],
  assumeMasterwork: boolean,
  generalMods: LockedMod[],
  raidCombatAndLegacyMods: LockedMod[]
) {
  const groupingFn = (item: DimItem) => {
    const statValues: number[] = [];
    const statsByHash = item.stats && _.keyBy(item.stats, (s) => s.statHash);
    // Ensure ordering of stats
    if (statsByHash) {
      for (const statType of statOrder) {
        statValues.push(statsByHash[statHashes[statType]].base);
      }
    }

    let groupId = `${statValues}${assumeMasterwork || item.energy?.energyCapacity === 10}`;

    if (raidCombatAndLegacyMods.length) {
      groupId += `${getSpecialtySocketMetadatas(item)
        ?.map((metadata) => metadata.slotTag)
        .join(',')}`;
    }

    // We don't need to worry about slot specific energy as items are already filtered for that.
    if (
      someModHasEnergyRequirement(raidCombatAndLegacyMods) ||
      someModHasEnergyRequirement(generalMods)
    ) {
      groupId += `${item.energy?.energyType}`;
    }
    return groupId;
  };

  return _.groupBy(items, groupingFn);
}
