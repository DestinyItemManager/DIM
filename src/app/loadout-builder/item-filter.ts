import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { assignBucketSpecificMods, ModMap } from 'app/loadout/mod-assignment-utils';
import { ItemFilter } from 'app/search/filter-types';
import { warnLog } from 'app/utils/log';
import { BucketHashes } from 'data/d2/generated-enums';
import {
  ArmorEnergyRules,
  ExcludedItems,
  ItemsByBucket,
  LockableBucketHash,
  LockableBucketHashes,
  LOCKED_EXOTIC_NO_EXOTIC,
  PinnedItems,
} from './types';

/**
 * Contains information about whether items got filtered out for various reasons.
 */
export interface FilterInfo {
  alwaysInvalidMods: PluggableInventoryItemDefinition[] | undefined;
  searchQueryEffective: boolean;
  perBucketStats: {
    [key in LockableBucketHash]: {
      totalConsidered: number;
      cantFitMods: number;
      finalValid: number;
    };
  };
}

/**
 * Filter the items map down given the locking and filtering configs.
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
  items: ItemsByBucket | undefined;
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;
  lockedModMap: ModMap;
  unassignedMods: PluggableInventoryItemDefinition[];
  lockedExoticHash: number | undefined;
  armorEnergyRules: ArmorEnergyRules;
  searchFilter: ItemFilter;
}): [ItemsByBucket, FilterInfo] {
  const filteredItems: {
    [bucketHash in LockableBucketHash]: readonly DimItem[];
  } = {
    [BucketHashes.Helmet]: [],
    [BucketHashes.Gauntlets]: [],
    [BucketHashes.ChestArmor]: [],
    [BucketHashes.LegArmor]: [],
    [BucketHashes.ClassArmor]: [],
  };

  const emptyFilterInfo = () => ({
    totalConsidered: 0,
    cantFitMods: 0,
    finalValid: 0,
  });

  const filterInfo: FilterInfo = {
    alwaysInvalidMods: undefined,
    searchQueryEffective: false,
    perBucketStats: {
      [BucketHashes.Helmet]: emptyFilterInfo(),
      [BucketHashes.Gauntlets]: emptyFilterInfo(),
      [BucketHashes.ChestArmor]: emptyFilterInfo(),
      [BucketHashes.LegArmor]: emptyFilterInfo(),
      [BucketHashes.ClassArmor]: emptyFilterInfo(),
    },
  };

  if (!items || !defs || unassignedMods.length) {
    return [filteredItems, filterInfo];
  }

  for (const bucket of LockableBucketHashes) {
    const lockedModsForPlugCategoryHash = lockedModMap.bucketSpecificMods[bucket] || [];

    if (items[bucket]) {
      // There can only be one pinned item as we hide items from the item picker once
      // a single item is pinned
      const pinnedItem = pinnedItems[bucket];
      const exotics = items[bucket].filter((item) => item.hash === lockedExoticHash);

      // We prefer most specific filtering since there can be competing conditions.
      // This means locked item and then exotic
      let firstPassFilteredItems = items[bucket];

      if (pinnedItem) {
        firstPassFilteredItems = [pinnedItem];
      } else if (exotics.length) {
        firstPassFilteredItems = exotics;
      } else if (lockedExoticHash === LOCKED_EXOTIC_NO_EXOTIC) {
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
          'does this happen enough to be worth reporting in some way?'
        );
      }

      // Use only Armor 2.0 items that aren't excluded and can take the bucket specific locked
      // mods energy type and cost.
      // Filtering the cost is necessary because process only checks mod energy
      // for combinations of bucket independent mods, and we might not pick those.
      const withoutExcluded = firstPassFilteredItems.filter(
        (item) => !excludedItems[bucket]?.some((excluded) => item.id === excluded.id)
      );
      const excludedAndModsFilteredItems = withoutExcluded.filter(
        (item) =>
          assignBucketSpecificMods({
            item,
            armorEnergyRules,
            modsToAssign: lockedModsForPlugCategoryHash,
          }).unassigned.length === 0
      );

      const searchFilteredItems = excludedAndModsFilteredItems.filter(searchFilter);

      filteredItems[bucket] = searchFilteredItems.length
        ? searchFilteredItems
        : excludedAndModsFilteredItems;

      filterInfo.searchQueryEffective ||=
        searchFilteredItems.length > 0 &&
        searchFilteredItems.length !== excludedAndModsFilteredItems.length;

      filterInfo.perBucketStats[bucket] = {
        totalConsidered: firstPassFilteredItems.length,
        cantFitMods: withoutExcluded.length - excludedAndModsFilteredItems.length,
        finalValid: filteredItems[bucket].length,
      };
    }
  }

  return [filteredItems, filterInfo];
}
