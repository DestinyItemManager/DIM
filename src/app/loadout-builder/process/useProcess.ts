import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { keyByStatHash } from 'app/inventory/store/stats';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { calculateAssumedItemEnergy, isArmorEnergyLocked } from 'app/loadout/armor-upgrade-utils';
import { activityModPlugCategoryHashes } from 'app/loadout/known-values';
import { bucketHashToPlugCategoryHash } from 'app/loadout/mod-utils';
import {
  armor2PlugCategoryHashesByName,
  MAX_ARMOR_ENERGY_CAPACITY,
} from 'app/search/d2-known-values';
import { combatCompatiblePlugCategoryHashes } from 'app/search/specialty-modslots';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import {
  getInterestingSocketMetadatas,
  getModTypeTagByPlugCategoryHash,
} from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { proxy, releaseProxy, wrap } from 'comlink';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { StatsSet } from '../process-worker/stats-set';
import { ProcessItemsByBucket } from '../process-worker/types';
import { ArmorEnergyRules, ArmorSet, ItemsByBucket, StatFilters, StatRanges } from '../types';
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
    processTime: number;
    statRangesFiltered?: StatRanges;
  } | null;
}

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
export function useProcess({
  defs,
  selectedStore,
  filteredItems,
  lockedMods,
  subclass,
  armorEnergyRules,
  statOrder,
  statFilters,
  anyExotic,
}: {
  defs: D2ManifestDefinitions;
  selectedStore: DimStore;
  filteredItems: ItemsByBucket;
  lockedMods: PluggableInventoryItemDefinition[];
  subclass: ResolvedLoadoutItem | undefined;
  armorEnergyRules: ArmorEnergyRules;
  statOrder: number[];
  statFilters: StatFilters;
  anyExotic: boolean;
}) {
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
        items,
        statOrder,
        armorEnergyRules,
        generalMods,
        combatMods,
        activityMods
      );

      for (const group of groupedItems) {
        const item = group.length ? group[0] : null;

        if (item && defs) {
          processItems[bucketHash].push(
            mapDimItemToProcessItem({
              dimItem: item,
              armorEnergyRules,
              modsForSlot: lockedModMap[bucketHashToPlugCategoryHash[item.bucket.hash]],
            })
          );
          itemsById.set(item.id, group);
        }
      }
    }

    const lockedProcessMods = _.mapValues(lockedModMap, (mods) =>
      mods.map(mapArmor2ModToProcessMod)
    );

    const subclassPlugs = subclass?.loadoutItem.socketOverrides
      ? Object.values(subclass.loadoutItem.socketOverrides)
          .map((hash) => defs.InventoryItem.get(hash))
          .filter(isPluggableItem)
      : emptyArray<PluggableInventoryItemDefinition>();

    // TODO: could potentially partition the problem (split the largest item category maybe) to spread across more cores
    const workerStart = performance.now();
    worker
      .process(
        processItems,
        getTotalModStatChanges(lockedMods, subclassPlugs, selectedStore.classType),
        lockedProcessMods,
        statOrder,
        statFilters,
        anyExotic,
        proxy(setRemainingTime)
      )
      .then(({ sets, combos, statRangesFiltered }) => {
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
            processTime: performance.now() - processStart,
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
    lockedMods,
    selectedStore.classType,
    selectedStore.id,
    statFilters,
    statOrder,
    anyExotic,
    subclass?.loadoutItem.socketOverrides,
    armorEnergyRules,
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

// comparator for sorting items in groups generated by groupItems. These items will all have the same stats.
const groupComparator = chainComparator(
  // Prefer higher-energy (ideally masterworked)
  compareBy((item: DimItem) => -(item.energy?.energyCapacity || 0)),
  // Prefer items that are equipped
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
 * - Exoticness (every exotic must be distinguished from other exotics and all legendaries)
 * - If there are energy requirements for slot independent mods it creates groups split by energy type
 * - If there are activity mods it will create groups split by specialty socket tag
 */
function groupItems(
  items: readonly DimItem[],
  statOrder: number[],
  armorEnergyRules: ArmorEnergyRules,
  generalMods: PluggableInventoryItemDefinition[],
  combatMods: PluggableInventoryItemDefinition[],
  activityMods: PluggableInventoryItemDefinition[]
) {
  // We group in two passes - first by things like mod requirements, then by stats. In-between we drop any
  // items which are strictly inferior in stats (all stats less than or equal to another item) from each group.

  // Figure out all the energy types that have been requested across all mods
  const requiredEnergyTypes = new Set<DestinyEnergyType>();
  for (const mod of [...combatMods, ...generalMods, ...activityMods]) {
    if (mod.plug.energyCost && mod.plug.energyCost.energyType !== DestinyEnergyType.Any) {
      requiredEnergyTypes.add(mod.plug.energyCost.energyType);
    }
  }

  // Figure out all the interesting mod slots required by mods are. This is just
  // raid/nightmare, we don't care about combat and general mod slots because
  // all items have them.
  const requiredActivityModSlots = new Set<string>();
  for (const mod of activityMods) {
    const modTag = getModTypeTagByPlugCategoryHash(mod.plug.plugCategoryHash);
    if (modTag) {
      requiredActivityModSlots.add(modTag);
    }
  }

  // Group by any restrictions so that items within the group can be freely exchanged subject
  // to the user's mod choices. This means grouping by mod slot tags, mod energy capacity and type
  // and exoticness. The groups for mod energies and tags are based on the mods
  // requested - for example if we only request solar mods, the groups should be
  // "solar", and "other", not "solar", "arc", "void", "stasis". If we only request
  // a vault of glass mod, we don't make a group that includes deep stone crypt mods.
  const modGroupingFn = (item: DimItem) => {
    // Ensure exotics always form a distinct group
    let groupId = item.isExotic ? `${item.hash}` : '';

    if (requiredActivityModSlots.size) {
      const socketTags = getInterestingSocketMetadatas(item) ?? [];
      for (const socketTag of socketTags) {
        // Only add to the grouping key if the socket matches what we need
        if (requiredActivityModSlots.has(socketTag.slotTag)) {
          groupId += socketTag.slotTag;
        }
      }
    }

    groupId += '-';

    if (requiredEnergyTypes.size) {
      groupId +=
        // Only add the grouping key if the socket matches what we need, otherwise it doesn't matter
        item.energy &&
        requiredEnergyTypes.has(item.energy.energyType) &&
        // If we can swap to another energy type, there's no need to group by current energy type
        isArmorEnergyLocked(item, armorEnergyRules)
          ? item.energy.energyType
          : DestinyEnergyType.Any;
    }

    return groupId;
  };

  const statsCache = new Map<DimItem, number[]>();
  for (const item of items) {
    const statValues: number[] = [];
    const statsByHash = item.stats && keyByStatHash(item.stats);
    // Ensure ordering of stats
    // TODO: statOrder includes disabled stats, should we omit them?
    if (statsByHash) {
      const assumedEnergy = calculateAssumedItemEnergy(item, armorEnergyRules);
      for (const statHash of statOrder) {
        let value = statsByHash[statHash]!.base;
        // Add in masterwork stat bonus if we're assuming masterwork stats
        if (assumedEnergy === MAX_ARMOR_ENERGY_CAPACITY) {
          value += 2;
        }
        statValues.push(value);
      }
      // Also use assumed energy because a class item with 9 energy is better than one with 8
      statValues.push(assumedEnergy);
    }
    statsCache.set(item, statValues);
  }

  // Group items by their exact stats. The statsCache includes mod energy capacity
  // but that's fine because items in the same group with the same stats but lower
  // energy capacities already got excluded.
  const statGroupingFn = (item: DimItem) => statsCache.get(item)!.toString();

  const modGroups = _.groupBy(items, modGroupingFn);

  // Final grouping by both mod requirements AND exact stats
  const groups: DimItem[][] = [];

  // Go through each grouping-by-mod, throw out any items with worse stats than
  // another item in that group, then use what's left to build groups by exact stats.
  for (const group of Object.values(modGroups)) {
    const statSet = new StatsSet<DimItem>();
    const keepSet: DimItem[] = [];

    // Build the stat set
    for (const item of group) {
      const stats = statsCache.get(item);
      if (stats) {
        statSet.insert(stats, item);
      }
    }

    // Loop back through and see if anything in this group was better
    for (const item of group) {
      const stats = statsCache.get(item);
      if (stats && !statSet.doBetterStatsExist(stats)) {
        keepSet.push(item);
      }
    }

    const groupedByStats = _.groupBy(keepSet, statGroupingFn);
    groups.push(...Object.values(groupedByStats));
  }

  for (const group of groups) {
    group.sort(groupComparator);
  }

  return groups;
}
