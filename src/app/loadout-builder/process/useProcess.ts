import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { getModTypeTagByPlugCategoryHash } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { proxy, releaseProxy, wrap } from 'comlink';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { ProcessItem, ProcessItemsByBucket, ProcessStatistics } from '../process-worker/types';
import {
  ArmorEnergyRules,
  ArmorSet,
  ItemGroup,
  ItemsByBucket,
  StatFilters,
  StatRanges,
} from '../types';
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
    /**
     * The mods and rules used to generate the sets above. The sets
     * are guaranteed (modulo bugs in worker) to fit these mods given
     * these settings, so set rendering must use these to render sets.
     * Otherwise set rendering may render old sets with new settings/mods,
     * which will fail in ways indistinguishable from legitimate mismatches.
     */
    mods: PluggableInventoryItemDefinition[];
    armorEnergyRules: ArmorEnergyRules;
    combos: number;
    processTime: number;
    statRangesFiltered?: StatRanges;

    // What the actual process did to remove some sets.
    processInfo: ProcessStatistics | undefined;
  } | null;
}

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
export function useProcess({
  defs,
  selectedStore,
  filteredItems,
  lockedModMap,
  subclass,
  armorEnergyRules,
  statOrder,
  statFilters,
  anyExotic,
  autoStatMods,
}: {
  defs: D2ManifestDefinitions;
  selectedStore: DimStore;
  filteredItems: ItemsByBucket;
  lockedModMap: ModMap;
  subclass: ResolvedLoadoutItem | undefined;
  armorEnergyRules: ArmorEnergyRules;
  statOrder: number[];
  statFilters: StatFilters;
  anyExotic: boolean;
  autoStatMods: boolean;
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

    const { allMods, bucketSpecificMods, activityMods, combatMods, generalMods } = lockedModMap;

    const lockedProcessMods = {
      generalMods: generalMods.map(mapArmor2ModToProcessMod),
      combatMods: combatMods.map(mapArmor2ModToProcessMod),
      activityMods: activityMods.map(mapArmor2ModToProcessMod),
    };

    const processItems: ProcessItemsByBucket = {
      [BucketHashes.Helmet]: [],
      [BucketHashes.Gauntlets]: [],
      [BucketHashes.ChestArmor]: [],
      [BucketHashes.LegArmor]: [],
      [BucketHashes.ClassArmor]: [],
    };
    const itemsById = new Map<string, ItemGroup>();

    for (const [bucketHash, items] of Object.entries(filteredItems)) {
      processItems[bucketHash] = [];

      const groupedItems = mapItemsToGroups(
        items,
        statOrder,
        armorEnergyRules,
        generalMods,
        combatMods,
        activityMods,
        bucketSpecificMods[bucketHash] || []
      );

      for (const group of groupedItems) {
        processItems[bucketHash].push(group.canonicalProcessItem);
        itemsById.set(group.canonicalProcessItem.id, group);
      }
    }

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
        getTotalModStatChanges(allMods, subclassPlugs, selectedStore.classType),
        lockedProcessMods,
        statOrder,
        statFilters,
        anyExotic,
        autoStatMods,
        proxy(setRemainingTime)
      )
      .then(({ sets, combos, statRangesFiltered, processInfo }) => {
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
            mods: allMods,
            armorEnergyRules,
            combos,
            processTime: performance.now() - processStart,
            statRangesFiltered,
            processInfo,
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
    selectedStore.classType,
    selectedStore.id,
    statFilters,
    statOrder,
    anyExotic,
    subclass?.loadoutItem.socketOverrides,
    armorEnergyRules,
    autoStatMods,
    lockedModMap,
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

interface MappedItem {
  dimItem: DimItem;
  processItem: ProcessItem;
}

// comparator for sorting items in groups generated by groupItems. These items will all have the same stats.
const groupComparator = chainComparator(
  // Prefer higher-energy (ideally masterworked)
  compareBy(({ dimItem }: MappedItem) => -(dimItem.energy?.energyCapacity || 0)),
  // Prefer items that are equipped
  compareBy(({ dimItem }: MappedItem) => (dimItem.equipped ? 0 : 1))
);

/**
 * To reduce the number of items sent to the web worker we group items by a number of varying
 * parameters, depending on what mods and armour upgrades are selected. This is purely an optimization
 * and most of the time only has an effect for class items, but this can be a significant improvement
 * when we only have to check 1-4 class items instead of 12.
 *
 * After items have been grouped we only send a single item (the first one) as a representative of
 * said group. All other grouped items will be available by the swap icon in the UI.
 *
 * An important property of this grouping is that all items within a single group must be interchangeable
 * for any possible assignment of mods.
 *
 * Creating a group for every item is trivially correct but inefficient. Erroneously forgetting to include a bit
 * of information in the grouping key that is relevant to the web worker results in the worker failing to discover
 * certain sets, or set rendering suddenly failing in unexpected ways when it prefers an alternative due to an existing
 * loadout or more convenient energy types, so everything in ProcessItem that affects the operation of the worker
 * must be accounted for in this function.
 *
 * It can group by any number of the following concepts depending on locked mods and armor upgrades,
 * - Stat distribution
 * - Masterwork status
 * - Exoticness (every exotic must be distinguished from other exotics and all legendaries)
 * - Energy capacity
 * - If there are energy requirements for slot independent mods it creates groups split by energy type
 * - If there are mods with tags (activity/combat style) it will create groups split by compatible tags
 */
function mapItemsToGroups(
  items: readonly DimItem[],
  statOrder: number[],
  armorEnergyRules: ArmorEnergyRules,
  generalMods: PluggableInventoryItemDefinition[],
  combatMods: PluggableInventoryItemDefinition[],
  activityMods: PluggableInventoryItemDefinition[],
  modsForSlot: PluggableInventoryItemDefinition[]
): ItemGroup[] {
  // Figure out all the energy types that have been requested across all mods.
  // Purposefully not including bucket-specific mods here, because in either case it doesn't matter:
  //   1. modsForSlot has no elemental mods. They have no effect on the loop.
  //   2. modsForSlot has elemental mods. All items will be forced to that element type anyway,
  //      so elemental affinity doesn't create separate groups.
  const requiredEnergyTypes = new Set<DestinyEnergyType>();
  for (const mod of [...combatMods, ...generalMods, ...activityMods]) {
    if (mod.plug.energyCost && mod.plug.energyCost.energyType !== DestinyEnergyType.Any) {
      requiredEnergyTypes.add(mod.plug.energyCost.energyType);
    }
  }

  // Figure out all the interesting mod slots required by mods are.
  // This includes combat mod tags because blue-quality items don't have them
  // and there may be legacy items that can slot CWL/Warmind Cell mods but not
  // Elemental Well mods?
  const requiredModTags = new Set<string>();
  for (const mod of [...combatMods, ...activityMods]) {
    const modTag = getModTypeTagByPlugCategoryHash(mod.plug.plugCategoryHash);
    if (modTag) {
      requiredModTags.add(modTag);
    }
  }

  // First, map the DimItems to ProcessItems so that we can consider all things relevant to Loadout Optimizer.
  const mappedItems: MappedItem[] = items.map((dimItem) => ({
    dimItem,
    processItem: mapDimItemToProcessItem({ dimItem, armorEnergyRules, modsForSlot }),
  }));

  // First, group by exoticness and energy type.
  const firstPassGroupingFn = ({ hash, isExotic, energy }: ProcessItem) => {
    // Ensure exotics always form a distinct group
    let groupId = isExotic ? `${hash}-` : 'legendary-';

    if (requiredEnergyTypes.size) {
      groupId +=
        energy &&
        // We group all items locked to an energy type we don't care about
        // by using an `X` instead of the numerical energy type -- if we only
        // want to assign Solar mods, we can put all items locked to Void,
        // Stasis and Arc into their own group (apart from the Any items and
        // apart from the items locked to Solar)
        (energy.type !== DestinyEnergyType.Any
          ? requiredEnergyTypes.has(energy.type)
            ? energy.type
            : 'X'
          : DestinyEnergyType.Any);
    }

    return groupId;
  };

  // Second pass -- cache the worker-relevant information, except the one we used in the first pass.
  const cache = new Map<
    DimItem,
    { stats: number[]; energyCapacity: number; relevantModSeasons: Set<string> }
  >();
  for (const item of mappedItems) {
    // Id, name are not important, exoticness+hash and energy type were grouped by in phase 1.
    // Energy value is the same for all items.

    // Item stats are important for the stat results of a full set
    const statValues: number[] = statOrder.map((s) => item.processItem.stats[s]);
    // Energy capacity affects mod assignment
    const energyCapacity = item.processItem.energy?.capacity || 0;
    // Supported mod tags affect mod assignment
    const relevantModSeasons =
      item.processItem.compatibleModSeasons?.filter((season) => requiredModTags.has(season)) ?? [];
    relevantModSeasons.sort();

    cache.set(item.dimItem, {
      stats: statValues,
      energyCapacity,
      relevantModSeasons: new Set(relevantModSeasons),
    });
  }

  // Group items by everything relevant.
  const finalGroupingFn = (item: DimItem) => {
    const info = cache.get(item)!;
    return `${info.stats}-${info.energyCapacity}-${[...info.relevantModSeasons.values()]}`;
  };

  const energyGroups = _.groupBy(mappedItems, ({ processItem }) =>
    firstPassGroupingFn(processItem)
  );

  // Final grouping by everything relevant
  const groups: ItemGroup[] = [];

  // Go through each grouping-by-energy-type, throw out any items with strictly worse properties than
  // another item in that group, then use what's left to build groups by their properties.
  for (const group of Object.values(energyGroups)) {
    const keepSet: MappedItem[] = [];

    // Checks if test is a superset of existing, i.e. every value of existing is contained in test
    const isSuperset = <T>(test: Set<T>, existing: Set<T>) =>
      [...existing.values()].every((v) => test.has(v));

    const isStrictlyBetter = (testItem: MappedItem, existingItem: MappedItem) => {
      const testInfo = cache.get(testItem.dimItem)!;
      const existingInfo = cache.get(existingItem.dimItem)!;

      const betterOrEqual =
        testInfo.stats.every((statValue, idx) => statValue >= existingInfo.stats[idx]) &&
        testInfo.energyCapacity >= existingInfo.energyCapacity &&
        isSuperset(testInfo.relevantModSeasons, existingInfo.relevantModSeasons);
      if (!betterOrEqual) {
        return false;
      }
      // The item is better or equal, so check if there are any differences -- if any of these properties are not equal
      // it means the item is better in one of these dimensions, so it must be strictly better.
      const isDifferent =
        testInfo.stats.some((statValue, idx) => statValue !== existingInfo.stats[idx]) ||
        testInfo.energyCapacity !== existingInfo.energyCapacity ||
        testInfo.relevantModSeasons.size !== existingInfo.relevantModSeasons.size;
      return isDifferent;
    };

    for (const item of group) {
      let dominated = false;
      for (let idx = keepSet.length - 1; idx >= 0; idx--) {
        if (isStrictlyBetter(keepSet[idx], item)) {
          dominated = true;
          break;
        }
        if (isStrictlyBetter(item, keepSet[idx])) {
          keepSet.splice(idx, 1);
        }
      }
      if (!dominated) {
        keepSet.push(item);
      }
    }

    const groupedByEverything = _.groupBy(keepSet, ({ dimItem }) => finalGroupingFn(dimItem));
    const newGroups = Object.values(groupedByEverything);
    for (const group of newGroups) {
      group.sort(groupComparator);
      groups.push({
        canonicalProcessItem: group[0].processItem,
        items: group.map(({ dimItem }) => dimItem),
      });
    }
  }

  return groups;
}
