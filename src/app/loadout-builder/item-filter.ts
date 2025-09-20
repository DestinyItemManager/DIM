import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { calculateAssumedMasterworkStats } from 'app/loadout-drawer/loadout-utils';
import { calculateAssumedItemEnergy } from 'app/loadout/armor-upgrade-utils';
import { ModMap, assignBucketSpecificMods } from 'app/loadout/mod-assignment-utils';
import { armorStats } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { sumBy } from 'app/utils/collections';
import { getModTypeTagByPlugCategoryHash, getSpecialtySocketMetadata } from 'app/utils/item-utils';
import { warnLog } from 'app/utils/log';
import { computeStatDupeLower } from 'app/utils/stats';
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
      removedStrictlyWorse: number;
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
    removedStrictlyWorse: 0,
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

  // Currently set bonuses take 2 or 4 pieces. Exotics are 1 item. Armor is 5 pieces total.
  // 2 + 2 + 1 = 4 + 1 = 5
  // If the user has locked an exotic, AND they have asked for set bonus(es) that require 4 items,
  // either 4 of the same set, or 2 each of 2 sets, then  filter legendaries items to those sets.

  /** If set, only use items with these set bonuses. */
  let includeOnlySetBonusHashes: undefined | number[];
  if (setBonuses && sum(Object.values(setBonuses)) >= 4 && lockedExoticDef) {
    includeOnlySetBonusHashes = Object.keys(setBonuses).map(Number);
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
    if (includeOnlySetBonusHashes && !lockedExoticApplicable) {
      firstPassFilteredItems = firstPassFilteredItems.filter(
        (item) => item.setBonus && includeOnlySetBonusHashes.includes(item.setBonus.hash),
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

    let removedStrictlyWorse = 0;
    if (finalFilteredItems.length > 1) {
      // One last pass - remove items that are strictly worse than others. This
      // uses the same general logic as the `is:statlower` search filter, but
      // also considers the energy capacity of the items and the set of activity
      // mod slots they have. So if two items have the same stats, but one has
      // more energy capacity or more relevant slots, it will be kept. Since we
      // reuse the logic from `is:statlower`, this also takes into account
      // artifice/tuning mods.
      // This duplicates some logic from mapDimItemToProcessItem, but it's
      // easier to filter items out here than to do it later.
      const getStats = (item: DimItem) => {
        // Masterwork them up to the assumed masterwork level
        const masterworkedStatValues = calculateAssumedMasterworkStats(item, armorEnergyRules);
        const compatibleModSeason = getSpecialtySocketMetadata(item)?.slotTag;
        const capacity = calculateAssumedItemEnergy(item, armorEnergyRules);
        const modsCost = lockedModsForPlugCategoryHash
          ? sumBy(lockedModsForPlugCategoryHash, (mod) => mod.plug.energyCost?.energyCost ?? 0)
          : 0;
        const remainingEnergyCapacity = capacity - modsCost;
        return [
          ...armorStats.map((statHash) => ({
            statHash,
            value: masterworkedStatValues[statHash] ?? 0,
          })),
          { statHash: -2, value: remainingEnergyCapacity },
          ...requiredModTagsArray.map((tag) => ({
            statHash: -3, // ←↑ Dummy/temp stat hashes. Just need to not match real armor stat hashes.
            value: compatibleModSeason === tag ? 1 : 0,
          })),
          // Add a comparison stat for each required set bonus. An item that has that bonus scores 1, others score zero.
          // Statlower will make sure any matching set bonus item won't lose to an item without it.
          ...Object.keys(setBonuses || {}).map((h) => {
            const setBonusHash = parseInt(h, 10);
            return {
              statHash: -10 - setBonusHash,
              value: item.setBonus?.hash === setBonusHash ? 1 : 0,
            };
          }),
        ];
      };

      const strictlyWorseItemIds = computeStatDupeLower(
        finalFilteredItems,
        // Consider all stats, even if they're not enabled - we still want the
        // highest total stats.
        armorStats,
        // Use our own getStats function to consider energy capacity and activity mod slots
        getStats,
      );
      finalFilteredItems = finalFilteredItems.filter((item) => !strictlyWorseItemIds.has(item.id));
      removedStrictlyWorse = strictlyWorseItemIds.size;
    }

    filteredItems[bucket] = finalFilteredItems;
    filterInfo.perBucketStats[bucket] = {
      totalConsidered: firstPassFilteredItems.length,
      cantFitMods: withoutExcluded.length - itemsThatFitMods.length,
      removedBySearchFilter,
      removedStrictlyWorse,
      finalValid: finalFilteredItems.length,
    };
  }

  return [filteredItems, filterInfo];
}
