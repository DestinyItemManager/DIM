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
  filter: ItemFilter
): ItemsByBucket {
  const filteredItems: { [bucket: number]: readonly DimItem[] } = {};

  if (!items || !defs) {
    return filteredItems;
  }

  const lockedModMap = _.groupBy(lockedMods, (mod) => mod.plug.plugCategoryHash);

  Object.keys(items).forEach((bucketStr) => {
    const bucket = parseInt(bucketStr, 10);
    const locked = lockedMap[bucket];

    // if we are locking an item in that bucket, filter to only include that single item
    if (locked?.length) {
      const lockedItem = locked[0];
      if (lockedItem.type === 'item') {
        filteredItems[bucket] = [lockedItem.item];
        return;
      }
    }

    // otherwise flatten all item instances to each bucket
    filteredItems[bucket] = items[bucket].filter(filter);
    if (!filteredItems[bucket].length) {
      // If nothing matches, just include everything so we can make valid sets
      filteredItems[bucket] = items[bucket];
    }
  });

  // filter to only include items that are in the locked map and items that have the correct energy
  Object.values(LockableBuckets).forEach((bucket) => {
    const locked = lockedMap[bucket];
    const lockedModsByPlugCategoryHash = lockedModMap[bucketsToCategories[bucket]];

    if (filteredItems[bucket]) {
      filteredItems[bucket] = filteredItems[bucket].filter(
        (item) =>
          (!lockedExotic ||
            (bucket === lockedExotic.bucketHash
              ? item.hash === lockedExotic.def.hash
              : item.equippingLabel !== lockedExotic.def.equippingBlock!.uniqueLabel)) &&
          // handle locked items and mods cases
          (!locked || locked.every((lockedItem) => matchLockedItem(item, lockedItem))) &&
          (!lockedModsByPlugCategoryHash ||
            lockedModsByPlugCategoryHash.every((mod) =>
              doEnergiesMatch(defs, mod, item, upgradeSpendTier)
            ))
      );
    }
  });

  return filteredItems;
}

export function matchLockedItem(item: DimItem, lockedItem: LockedItemType) {
  switch (lockedItem.type) {
    case 'exclude':
      return item.id !== lockedItem.item.id;
    case 'item':
      return item.id === lockedItem.item.id;
  }
}
