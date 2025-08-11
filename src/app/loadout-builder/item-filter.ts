import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { calculateAssumedMasterworkStats } from 'app/loadout-drawer/loadout-utils';
import { calculateAssumedItemEnergy } from 'app/loadout/armor-upgrade-utils';
import { ModMap, assignBucketSpecificMods } from 'app/loadout/mod-assignment-utils';
import { armorStats } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { computeStatDupeLower } from 'app/search/items/search-filters/dupes';
import { sumBy } from 'app/utils/collections';
import { getModTypeTagByPlugCategoryHash, getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { warnLog } from 'app/utils/log';
import { BucketHashes } from 'data/d2/generated-enums';
import { sum } from 'es-toolkit';
import { Draft } from 'immer';
import {
  ArmorBucketHash,
  ArmorBucketHashes,
  ArmorEnergyRules,
  ExcludedItems,
  ItemsByBucket,
  LOCKED_EXOTIC_ANY_EXOTIC,
  LOCKED_EXOTIC_NO_EXOTIC,
  PinnedItems,
} from './types';

/**
 * Contains information about whether items got filtered out for various reasons.
 */
export interface FilterInfo {
  /** Did the search query limit items for any bucket? */
  searchQueryEffective: boolean;
  exoticDoesNotExist: boolean;
  perBucketStats: {
    [key in ArmorBucketHash]: {
      totalConsidered: number;
      cantFitMods: number;
      finalValid: number;
      removedBySearchFilter: number;
    };
  };
}

/**
 * Filter the `items` map down given the locking and filtering configs and some
 * basic logic about what could go together in a loadout. The goal here is to
 * remove as many items as possible from consideration without expensive logic.
 */
export function filterItems({
  defs,
  items,
  pinnedItems,
  excludedItems,
  lockedModMap,
  unassignedMods,
  lockedExoticHash,
  armorEnergyRules,
  searchFilter,
  setBonuses,
}: {
  defs: D2ManifestDefinitions | undefined;
  items: DimItem[];
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;
  lockedModMap: ModMap;
  unassignedMods: PluggableInventoryItemDefinition[];
  lockedExoticHash: number | undefined;
  armorEnergyRules: ArmorEnergyRules;
  searchFilter: ItemFilter;
  setBonuses?: SetBonusCounts;
}): [ItemsByBucket, FilterInfo] {
  const filteredItems: Draft<ItemsByBucket> = {
    [BucketHashes.Helmet]: [],
    [BucketHashes.Gauntlets]: [],
    [BucketHashes.ChestArmor]: [],
    [BucketHashes.LegArmor]: [],
    [BucketHashes.ClassArmor]: [],
  };

  const emptyFilterInfo = {
    totalConsidered: 0,
    cantFitMods: 0,
    finalValid: 0,
    removedBySearchFilter: 0,
  };

  const filterInfo: FilterInfo = {
    searchQueryEffective: false,
    exoticDoesNotExist: false,
    perBucketStats: {
      [BucketHashes.Helmet]: { ...emptyFilterInfo },
      [BucketHashes.Gauntlets]: { ...emptyFilterInfo },
      [BucketHashes.ChestArmor]: { ...emptyFilterInfo },
      [BucketHashes.LegArmor]: { ...emptyFilterInfo },
      [BucketHashes.ClassArmor]: { ...emptyFilterInfo },
    },
  };

  if (!items.length || !defs || unassignedMods.length) {
    return [filteredItems, filterInfo];
  }

  // Usability hack: If the user requests any exotic but none of the exotics match the search filter, ignore the search filter for exotics.
  // This allows things like `modslot:xyz` to apply to legendary armor without removing all exotics.
  const excludeExoticsFromFilter =
    lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC &&
    !Object.values(items)
      .flat()
      .some(
        (item) =>
          item.isExotic && lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC && searchFilter(item),
      );

  // Group by bucket
  const itemsByBucket = Map.groupBy(items, (item) => item.bucket.hash as ArmorBucketHash);

  const lockedExoticDef =
    lockedExoticHash && lockedExoticHash > 0 ? defs.InventoryItem.get(lockedExoticHash) : undefined;

  const requiredModTags = new Set<string>();
  for (const mod of lockedModMap.activityMods) {
    const modTag = getModTypeTagByPlugCategoryHash(mod.plug.plugCategoryHash);
    if (modTag) {
      requiredModTags.add(modTag);
    }
  }
  const requiredModTagsArray = Array.from(requiredModTags).sort();

  // If the user has locked an exotic, AND they have asked for set bonuses that
  // require 4 items, we can filter down to just items that have that set bonus.
  let setBonusHashes: number[] = [];
  if (setBonuses && sum(Object.values(setBonuses)) >= 4 && lockedExoticDef) {
    // If the user has set bonuses, we can filter down to just items that have that set bonus.
    setBonusHashes = Object.keys(setBonuses).map(Number);
  }

  for (const bucket of ArmorBucketHashes) {
    const lockedModsForPlugCategoryHash = lockedModMap.bucketSpecificMods[bucket] || [];

    // There can only be one pinned item as we hide items from the item picker once
    // a single item is pinned
    const pinnedItem = pinnedItems[bucket];
    const lockedExoticApplicable =
      lockedExoticHash !== undefined &&
      lockedExoticHash > 0 &&
      lockedExoticDef?.inventory?.bucketTypeHash === bucket;
    const exotics = lockedExoticApplicable
      ? (itemsByBucket.get(bucket) ?? []).filter(
          (item) =>
            item.hash === lockedExoticHash || item.name === lockedExoticDef.displayProperties.name,
        )
      : undefined;

    if (lockedExoticApplicable && !exotics?.length) {
      filterInfo.exoticDoesNotExist = true;
    }

    // We prefer most specific filtering since there can be competing conditions.
    // This means locked item and then exotic
    let firstPassFilteredItems = itemsByBucket.get(bucket) ?? [];

    if (pinnedItem) {
      // If the user pinned an item, that's what they get
      firstPassFilteredItems = [pinnedItem];
    } else if (exotics) {
      // If the user chose an exotic, only include items matching that exotic
      firstPassFilteredItems = exotics;
    } else if (
      // The user chose to exclude all exotics
      lockedExoticHash === LOCKED_EXOTIC_NO_EXOTIC ||
      // The locked exotic is in a different bucket, so we can remove all
      // exotics from this bucket
      (lockedExoticDef && !lockedExoticApplicable)
    ) {
      firstPassFilteredItems = firstPassFilteredItems.filter((i) => !i.isExotic);
    }

    if (!firstPassFilteredItems.length) {
      warnLog(
        'loadout optimizer',
        'no items for bucket',
        bucket,
        'does this happen enough to be worth reporting in some way?',
      );
    }

    // If every non-exotic requires set bonuses...
    if (setBonusHashes.length && !lockedExoticApplicable) {
      firstPassFilteredItems = firstPassFilteredItems.filter(
        (item) => item.setBonus && setBonusHashes.includes(item.setBonus.hash),
      );
    }

    // Remove manually excluded items
    const withoutExcluded = firstPassFilteredItems.filter(
      (item) => !excludedItems[bucket]?.some((excluded) => item.id === excluded.id),
    );

    // Remove armor that can't fit all the chosen bucket-specifics mods.
    // Filtering on energy cost is necessary because set generation only checks
    // mod energy for combinations of bucket independent mods.
    const itemsThatFitMods = withoutExcluded.filter(
      (item) =>
        assignBucketSpecificMods(armorEnergyRules, item, lockedModsForPlugCategoryHash).unassigned
          .length === 0,
    );

    const searchFilteredItems = itemsThatFitMods.filter(
      (item) => (item.isExotic && excludeExoticsFromFilter) || searchFilter(item),
    );

    // If a search filters out all the possible items for a bucket, we ignore
    // the search. This allows users to filter some buckets without getting
    // stuck making no sets.
    let finalFilteredItems = searchFilteredItems.length ? searchFilteredItems : itemsThatFitMods;
    const removedBySearchFilter = searchFilteredItems.length
      ? itemsThatFitMods.length - searchFilteredItems.length
      : 0;
    filterInfo.searchQueryEffective ||= removedBySearchFilter > 0;

    if (finalFilteredItems.length > 1) {
      // One last pass - remove items that are strictly worse than others. This
      // uses the same general logic as the `is:statlower` search filter, but
      // also considers the energy capacity of the items and the set of activity
      // mod slots they have. So if two items have the same stats, but one has
      // more energy capacity or more relevant slots, it will be kept. Since we
      // reuse the logic from `is:statlower`, this also takes into account
      // artifice/tuning mods.
      // This duplicates some logic from mapDimItemToProcessItem, but it's
      // easier to filter items out than to do it later.
      const getStats = (item: DimItem) => {
        // Masterwork them up to the assumed masterwork level
        const masterworkedStatValues = calculateAssumedMasterworkStats(item, armorEnergyRules);
        const compatibleModSeasons = getSpecialtySocketMetadatas(item)?.map((m) => m.slotTag);
        const capacity = calculateAssumedItemEnergy(item, armorEnergyRules);
        const modsCost = lockedModsForPlugCategoryHash
          ? sumBy(lockedModsForPlugCategoryHash, (mod) => mod.plug.energyCost?.energyCost ?? 0)
          : 0;
        const remainingEnergyCapacity = capacity - modsCost;
        return [
          ...armorStats.map((statHash) => masterworkedStatValues[statHash] ?? 0),
          remainingEnergyCapacity,
          ...requiredModTagsArray.map((tag) => (compatibleModSeasons?.includes(tag) ? 1 : 0)),
        ];
      };

      const strictlyWorseItemIds = computeStatDupeLower(
        finalFilteredItems,
        defs,
        // Consider all stats, even if they're not enabled - we still want the
        // highest total stats.
        armorStats,
        // Use our own getStats function to consider energy capacity and activity mod slots
        getStats,
      );
      finalFilteredItems = finalFilteredItems.filter((item) => !strictlyWorseItemIds.has(item.id));
    }

    filteredItems[bucket] = finalFilteredItems;
    filterInfo.perBucketStats[bucket] = {
      totalConsidered: firstPassFilteredItems.length,
      cantFitMods: withoutExcluded.length - itemsThatFitMods.length,
      removedBySearchFilter,
      finalValid: finalFilteredItems.length,
    };
  }

  return [filteredItems, filterInfo];
}
