import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { ItemFilter } from 'app/search/filter-types';
import _ from 'lodash';
import { LoadoutBuilderState } from './loadout-builder-reducer';
import { doEnergiesMatch } from './mod-utils';
import {
  bucketsToCategories,
  ItemsByBucket,
  LockableBuckets,
  LockedItemType,
  LockedMap,
} from './types';

/**
 * Filter the items map down given the locking and filtering configs.
 */
export function filterItems(
  defs: D2ManifestDefinitions | undefined,
  items: ItemsByBucket | undefined,
  lockedMap: LockedMap,
  lockedMods: PluggableInventoryItemDefinition[],
  lockedExotic: LoadoutBuilderState['lockedExotic'],
  upgradeSpendTier: UpgradeSpendTier,
  searchFilter: ItemFilter
): ItemsByBucket {
  const filteredItems: { [bucket: number]: readonly DimItem[] } = {};

  if (!items || !defs) {
    return filteredItems;
  }

  const lockedModMap = _.groupBy(lockedMods, (mod) => mod.plug.plugCategoryHash);

  Object.values(LockableBuckets).forEach((bucket) => {
    const locked = lockedMap[bucket];
    const lockedModsByPlugCategoryHash = lockedModMap[bucketsToCategories[bucket]];

    if (items[bucket]) {
      const searchItems = items[bucket].filter(searchFilter);
      const exotics = items[bucket].filter((item) => item.hash === lockedExotic?.def.hash);
      const lockedItems = items[bucket].filter((item) => matchLockedItems(item, locked));

      // No matter the results we need to filter by mod energy otherwise mod assignment
      // will go haywire
      filteredItems[bucket] = [...searchItems, ...exotics, ...lockedItems].filter((item) =>
        matchedLockedModEnergy(defs, item, lockedModsByPlugCategoryHash, upgradeSpendTier)
      );

      // If no items match we remove the search and item filters and just filter by mod energy
      if (!filteredItems[bucket].length) {
        filteredItems[bucket] = items[bucket].filter((item) =>
          matchedLockedModEnergy(defs, item, lockedModsByPlugCategoryHash, upgradeSpendTier)
        );
      }
    }
  });

  return filteredItems;
}

function matchLockedItems(item: DimItem, lockedItems?: readonly LockedItemType[]) {
  if (!lockedItems) {
    return false;
  }

  return lockedItems.every((lockedItem) => {
    switch (lockedItem.type) {
      case 'exclude':
        return item.id !== lockedItem.item.id;
      case 'item':
        return item.id === lockedItem.item.id;
    }
  });
}

function matchedLockedModEnergy(
  defs: D2ManifestDefinitions,
  item: DimItem,
  lockedModsByPlugCategoryHash: PluggableInventoryItemDefinition[],
  upgradeSpendTier: UpgradeSpendTier
) {
  if (!lockedModsByPlugCategoryHash) {
    return true;
  }
  return lockedModsByPlugCategoryHash.every((mod) =>
    doEnergiesMatch(defs, mod, item, upgradeSpendTier)
  );
}
