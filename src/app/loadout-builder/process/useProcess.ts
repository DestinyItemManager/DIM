import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { keyByStatHash } from 'app/inventory/store/stats';
import {
  canSwapEnergyFromUpgradeSpendTier,
  upgradeSpendTierToMaxEnergy,
} from 'app/loadout/armor-upgrade-utils';
import { activityModPlugCategoryHashes, bucketsToCategories } from 'app/loadout/mod-utils';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { combatCompatiblePlugCategoryHashes } from 'app/search/specialty-modslots';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { proxy, releaseProxy, wrap } from 'comlink';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { someModHasEnergyRequirement } from '../mod-utils';
import { ProcessItemsByBucket } from '../process-worker/types';
import { ArmorSet, ItemsByBucket, StatFilters, StatRanges } from '../types';
import {
  getTotalModStatChanges,
  hydrateArmorSet,
  mapArmor2ModToProcessMod,
  mapDimItemToProcessItem,
} from './mappers';

interface ProcessState {
  processing: boolean;
  resultStoreId: string;
  result: {
    sets: ArmorSet[];
    combos: number;
    combosWithoutCaps: number;
    statRanges?: StatRanges;
    statRangesFiltered?: StatRanges;
  } | null;
}

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
// TODO: introduce params object
export function useProcess(
  defs: D2ManifestDefinitions,
  selectedStore: DimStore,
  filteredItems: ItemsByBucket,
  lockedMods: PluggableInventoryItemDefinition[],
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean,
  statOrder: number[],
  statFilters: StatFilters,
  anyExotic: boolean,
  disabledDueToMaintenance: boolean
) {
  const [remainingTime, setRemainingTime] = useState(0);
  const [{ result, processing }, setState] = useState<ProcessState>({
    processing: false,
    resultStoreId: selectedStore.id,
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
    if (disabledDueToMaintenance) {
      return;
    }

    const processStart = performance.now();

    // Stop any previous worker
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const { worker, cleanup } = createWorker();
    cleanupRef.current = cleanup;

    setRemainingTime(0);
    setState((state) => ({
      processing: true,
      resultStoreId: selectedStore.id,
      result: selectedStore.id === state.resultStoreId ? state.result : null,
      currentCleanup: cleanup,
    }));

    const lockedModMap = _.groupBy(lockedMods, (mod) => mod.plug.plugCategoryHash);
    const generalMods = lockedModMap[armor2PlugCategoryHashesByName.general] || [];
    const combatMods = Object.entries(lockedModMap).flatMap(([plugCategoryHash, mods]) =>
      mods && combatCompatiblePlugCategoryHashes.includes(Number(plugCategoryHash)) ? mods : []
    );
    const activityMods = Object.entries(lockedModMap).flatMap(([plugCategoryHash, mods]) =>
      mods && activityModPlugCategoryHashes.includes(Number(plugCategoryHash)) ? mods : []
    );

    const processItems: ProcessItemsByBucket = {
      [BucketHashes.Helmet]: [],
      [BucketHashes.Gauntlets]: [],
      [BucketHashes.ChestArmor]: [],
      [BucketHashes.LegArmor]: [],
      [BucketHashes.ClassArmor]: [],
    };
    const itemsById = new Map<string, DimItem[]>();

    for (const [bucketHash, items] of Object.entries(filteredItems)) {
      processItems[bucketHash] = [];

      const groupedItems = groupItems(
        defs,
        items,
        statOrder,
        upgradeSpendTier,
        lockItemEnergyType,
        generalMods,
        combatMods,
        activityMods
      );

      for (const group of Object.values(groupedItems)) {
        const item = group.length ? group[0] : null;

        if (item && defs) {
          processItems[bucketHash].push(
            mapDimItemToProcessItem(
              defs,
              item,
              upgradeSpendTier,
              lockItemEnergyType,
              lockedModMap[bucketsToCategories[item.bucket.hash]]
            )
          );
          itemsById.set(item.id, group);
        }
      }
    }

    const lockedProcessMods = _.mapValues(lockedModMap, (mods) =>
      mods.map(mapArmor2ModToProcessMod)
    );

    // TODO: could potentially partition the problem (split the largest item category maybe) to spread across more cores
    const workerStart = performance.now();
    worker
      .process(
        processItems,
        getTotalModStatChanges(lockedMods, selectedStore.classType),
        lockedProcessMods,
        statOrder,
        statFilters,
        anyExotic,
        proxy(setRemainingTime)
      )
      .then(({ sets, combos, combosWithoutCaps, statRanges, statRangesFiltered }) => {
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
            statRangesFiltered,
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
    defs,
    filteredItems,
    lockItemEnergyType,
    lockedMods,
    selectedStore.classType,
    selectedStore.id,
    statFilters,
    statOrder,
    upgradeSpendTier,
    anyExotic,
    disabledDueToMaintenance,
  ]);

  return { result, processing, remainingTime };
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

// comparator for sorting items in groups generated by groupItems.
const groupComparator = chainComparator(
  compareBy((item: DimItem) => -(item.energy?.energyCapacity || 0)),
  compareBy((item: DimItem) => (item.equipped ? 0 : 1))
);

/**
 * To reduce the number of items sent to the web worker we group items by a number of varying
 * parameters, depending on what mods and armour upgrades are selected.
 *
 * After items have been grouped we only send a single item (the first one) as a representative of
 * said group. All other grouped items will be available by the swap icon in the UI.
 *
 * It can group by any number of the following concepts depending on locked mods and armor upgrades,
 * - Stat distribution
 * - Masterwork status
 * - If there are energy requirements for slot independant mods it creates groups split by energy type
 * - If there are activity mods it will create groups split by specialty socket tag
 */
function groupItems(
  defs: D2ManifestDefinitions | undefined,
  items: readonly DimItem[],
  statOrder: number[],
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean,
  generalMods: PluggableInventoryItemDefinition[],
  combatMods: PluggableInventoryItemDefinition[],
  activityMods: PluggableInventoryItemDefinition[]
) {
  const groupingFn = (item: DimItem) => {
    const statValues: number[] = [];
    const statsByHash = item.stats && keyByStatHash(item.stats);
    // Ensure ordering of stats
    if (statsByHash) {
      for (const statHash of statOrder) {
        statValues.push(statsByHash[statHash]!.base);
      }
    }

    let groupId = `${statValues}${
      defs && upgradeSpendTierToMaxEnergy(defs, upgradeSpendTier, item) === 10
    }`;

    if (activityMods.length) {
      groupId += `${getSpecialtySocketMetadatas(item)
        ?.map((metadata) => metadata.slotTag)
        .join(',')}`;
    }

    // We don't need to worry about slot specific energy as items are already filtered for that.
    if (
      someModHasEnergyRequirement(combatMods) ||
      someModHasEnergyRequirement(generalMods) ||
      someModHasEnergyRequirement(activityMods)
    ) {
      groupId +=
        defs && canSwapEnergyFromUpgradeSpendTier(defs, upgradeSpendTier, item, lockItemEnergyType)
          ? DestinyEnergyType.Any
          : `${item.energy?.energyType}`;
    }
    return groupId;
  };

  const groups = _.groupBy(items, groupingFn);

  for (const group of Object.values(groups)) {
    group.sort(groupComparator);
  }

  return groups;
}
