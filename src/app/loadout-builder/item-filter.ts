import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { assignBucketSpecificMods, ModMap } from 'app/loadout/mod-assignment-utils';
import { ItemFilter } from 'app/search/filter-types';
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
}): ItemsByBucket {
  const filteredItems: {
    [bucketHash in LockableBucketHash]: readonly DimItem[];
  } = {
    [BucketHashes.Helmet]: [],
    [BucketHashes.Gauntlets]: [],
    [BucketHashes.ChestArmor]: [],
    [BucketHashes.LegArmor]: [],
    [BucketHashes.ClassArmor]: [],
  };

  // If we have mods that don't fit into any items, then technically
  // all items are filtered out...
  if (!items || !defs || unassignedMods.length) {
    return filteredItems;
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
      }

      // TODO: Filter out exotics in other buckets that are not the locked exotic?

      // Use only Armor 2.0 items that aren't excluded and can take the bucket specific locked
      // mods energy type and cost.
      // Filtering the cost is necessary because process only checks mod energy
      // for combinations of bucket independent mods, and we might not pick those.
      const excludedAndModsFilteredItems = firstPassFilteredItems.filter(
        (item) =>
          !excludedItems[bucket]?.some((excluded) => item.id === excluded.id) &&
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
    }
  }

  return filteredItems;
}
