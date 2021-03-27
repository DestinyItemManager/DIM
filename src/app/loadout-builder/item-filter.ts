import { DimItem } from 'app/inventory/item-types';
import { ItemFilter } from 'app/search/filter-types';
import { doEnergiesMatch } from './mod-utils';
import {
  bucketsToCategories,
  ItemsByBucket,
  LockableBuckets,
  LockedItemType,
  LockedMap,
  LockedModMap,
} from './types';

/**
 * Filter the items map down given the locking and filtering configs.
 */
export function filterItems(
  items: ItemsByBucket | undefined,
  lockedMap: LockedMap,
  lockedModMap: LockedModMap,
  filter: ItemFilter
): ItemsByBucket {
  const filteredItems: { [bucket: number]: readonly DimItem[] } = {};

  if (!items) {
    return filteredItems;
  }

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
    const lockedMods = lockedModMap[bucketsToCategories[bucket]];

    if (filteredItems[bucket]) {
      filteredItems[bucket] = filteredItems[bucket].filter(
        (item) =>
          // handle locked items and mods cases
          (!locked || locked.every((lockedItem) => matchLockedItem(item, lockedItem))) &&
          (!lockedMods || lockedMods.every((mod) => doEnergiesMatch(mod, item)))
      );
    }
  });

  return filteredItems;
}

export function matchLockedItem(item: DimItem, lockedItem: LockedItemType) {
  switch (lockedItem.type) {
    case 'exclude':
      return item.id !== lockedItem.item.id;
    case 'perk':
      return item.sockets?.allSockets.some((slot) =>
        slot.plugOptions.some((plug) => lockedItem.perk.hash === plug.plugDef.hash)
      );
    case 'item':
      return item.id === lockedItem.item.id;
  }
}
