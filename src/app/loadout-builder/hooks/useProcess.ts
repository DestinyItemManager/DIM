import { DimItem } from 'app/inventory/item-types';
import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import { getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { releaseProxy, wrap } from 'comlink';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import {
  getTotalModStatChanges,
  hydrateArmorSet,
  mapArmor2ModToProcessMod,
  mapDimItemToProcessItem,
} from '../processWorker/mappers';
import { ProcessItemsByBucket } from '../processWorker/types';
import {
  ArmorSet,
  bucketsToCategories,
  ItemsByBucket,
  LockedMap,
  LockedMod,
  LockedModMap,
  MinMax,
  MinMaxIgnored,
  statHashes,
  StatTypes,
} from '../types';
import { someModHasEnergyRequirement } from '../utils';

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
  selectedStoreId: string | undefined,
  filteredItems: ItemsByBucket,
  lockedItems: LockedMap,
  lockedModMap: LockedModMap,
  assumeMasterwork: boolean,
  statOrder: StatTypes[],
  statFilters: { [statType in StatTypes]: MinMaxIgnored }
) {
  const [{ result, resultStoreId, processing }, setState] = useState<ProcessState>({
    processing: false,
    resultStoreId: selectedStoreId,
    result: null,
  });

  useEffect(() => {
    const processStart = performance.now();

    setState((state) => ({
      processing: true,
      resultStoreId: selectedStoreId,
      result: selectedStoreId === state.resultStoreId ? state.result : null,
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
    const { worker, cleanup } = createWorker();
    worker
      .process(
        processItems,
        getTotalModStatChanges(lockedModMap),
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
      // Shut down the worker, we're done with it
      .finally(() => cleanup());
  }, [
    filteredItems,
    lockedItems,
    lockedModMap,
    assumeMasterwork,
    statOrder,
    statFilters,
    selectedStoreId,
    resultStoreId,
  ]);

  return { result, processing };
}

function createWorker() {
  const instance = new Worker(new URL('../processWorker/ProcessWorker', import.meta.url));

  const worker = wrap<import('../processWorker/ProcessWorker').ProcessWorker>(instance);

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
