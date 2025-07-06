import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { ModMap, assignBucketSpecificMods } from 'app/loadout/mod-assignment-utils';
import { ItemFilter } from 'app/search/filter-types';
import { warnLog } from 'app/utils/log';
import { BucketHashes } from 'data/d2/generated-enums';
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

  for (const bucket of ArmorBucketHashes) {
    const lockedModsForPlugCategoryHash = lockedModMap.bucketSpecificMods[bucket] || [];

    // There can only be one pinned item as we hide items from the item picker once
    // a single item is pinned
    const pinnedItem = pinnedItems[bucket];
    const exotics = (itemsByBucket.get(bucket) ?? []).filter(
      (item) => item.hash === lockedExoticHash,
    );

    // We prefer most specific filtering since there can be competing conditions.
    // This means locked item and then exotic
    let firstPassFilteredItems = itemsByBucket.get(bucket) ?? [];

    if (pinnedItem) {
      // If the user pinned an item, that's what they get
      firstPassFilteredItems = [pinnedItem];
    } else if (exotics.length) {
      // If the user chose an exotic, only include items matching that exotic
      firstPassFilteredItems = exotics;
    } else if (lockedExoticHash === LOCKED_EXOTIC_NO_EXOTIC) {
      // The user chose to exclude all exotics
      firstPassFilteredItems = firstPassFilteredItems.filter((i) => !i.isExotic);
    } else if (lockedExoticHash !== undefined && lockedExoticHash > 0) {
      const def = defs.InventoryItem.get(lockedExoticHash);
      if (def.inventory?.bucketTypeHash !== bucket) {
        // The locked exotic is in a different bucket, so we can remove all
        // exotics from this bucket
        firstPassFilteredItems = firstPassFilteredItems.filter((i) => !i.isExotic);
      }
    }

    if (!firstPassFilteredItems.length) {
      warnLog(
        'loadout optimizer',
        'no items for bucket',
        bucket,
        'does this happen enough to be worth reporting in some way?',
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
    filteredItems[bucket] = searchFilteredItems.length ? searchFilteredItems : itemsThatFitMods;
    const removedBySearchFilter = searchFilteredItems.length
      ? itemsThatFitMods.length - searchFilteredItems.length
      : 0;
    filterInfo.searchQueryEffective ||= removedBySearchFilter > 0;

    filterInfo.perBucketStats[bucket] = {
      totalConsidered: firstPassFilteredItems.length,
      cantFitMods: withoutExcluded.length - itemsThatFitMods.length,
      removedBySearchFilter,
      finalValid: filteredItems[bucket].length,
    };
  }

  return [filteredItems, filterInfo];
}
