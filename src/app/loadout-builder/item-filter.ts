import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { ItemFilter } from 'app/search/filter-types';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { doEnergiesMatch } from './mod-utils';
import {
  bucketsToCategories,
  ExcludedItems,
  ItemsByBucket,
  LockableBucketHash,
  LockableBucketHashes,
  PinnedItems,
} from './types';

/**
 * Filter the items map down given the locking and filtering configs.
 */
export function filterItems(
  defs: D2ManifestDefinitions | undefined,
  items: ItemsByBucket | undefined,
  pinnedItems: PinnedItems,
  excludedItems: ExcludedItems,
  lockedMods: PluggableInventoryItemDefinition[],
  lockedExoticHash: number | undefined,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean,
  searchFilter: ItemFilter
): ItemsByBucket {
  const filteredItems: {
    [bucketHash in LockableBucketHash]: readonly DimItem[];
  } = {
    [BucketHashes.Helmet]: [],
    [BucketHashes.Gauntlets]: [],
    [BucketHashes.ChestArmor]: [],
    [BucketHashes.LegArmor]: [],
    [BucketHashes.ClassArmor]: [],
  };

  if (!items || !defs) {
    return filteredItems;
  }

  const lockedModMap = _.groupBy(lockedMods, (mod) => mod.plug.plugCategoryHash);

  for (const bucket of LockableBucketHashes) {
    const lockedModsByPlugCategoryHash = lockedModMap[bucketsToCategories[bucket]];

    if (items[bucket]) {
      const pinnedItem = pinnedItems[bucket];
      // There can only be one pinned item as we hide items from the item picker once
      // a single item is pinned
      const searchItems = items[bucket].filter(searchFilter);
      const exotics = items[bucket].filter((item) => item.hash === lockedExoticHash);

      // We prefer most specific filtering since there can be competing conditions.
      // This means locked item, then exotic, then search filter is preferred in that order.
      let firstPassFilteredItems = searchItems;

      if (pinnedItem) {
        firstPassFilteredItems = [pinnedItem];
      } else if (exotics.length) {
        firstPassFilteredItems = exotics;
      }

      // No matter the results we need to filter by mod energy otherwise mod assignment
      // will go haywire, also we can exclude items at this point
      filteredItems[bucket] = firstPassFilteredItems.filter(
        (item) =>
          !excludedItems[bucket]?.some((excluded) => item.id === excluded.id) &&
          matchedLockedModEnergy(
            defs,
            item,
            lockedModsByPlugCategoryHash,
            upgradeSpendTier,
            lockItemEnergyType
          )
      );

      // If no items match we remove the search and item filters and just filter by mod energy
      if (!filteredItems[bucket].length) {
        filteredItems[bucket] = items[bucket].filter((item) =>
          matchedLockedModEnergy(
            defs,
            item,
            lockedModsByPlugCategoryHash,
            upgradeSpendTier,
            lockItemEnergyType
          )
        );
      }
    }
  }

  return filteredItems;
}

function matchedLockedModEnergy(
  defs: D2ManifestDefinitions,
  item: DimItem,
  lockedModsByPlugCategoryHash: PluggableInventoryItemDefinition[],
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
) {
  if (!lockedModsByPlugCategoryHash) {
    return true;
  }
  return lockedModsByPlugCategoryHash.every((mod) =>
    doEnergiesMatch(defs, mod, item, upgradeSpendTier, lockItemEnergyType)
  );
}
