import {
  LockableBuckets,
  LockedMap,
  LockedArmor2ModMap,
  ItemsByBucket,
  LockedItemType,
} from './types';
import { Armor2ModPlugCategories, getItemDamageShortName } from 'app/utils/item-utils';
import { doEnergiesMatch } from './generated-sets/mod-utils';
import { canSlotMod } from './generated-sets/utils';
import { DimItem } from 'app/inventory/item-types';

const bucketsToCategories = {
  [LockableBuckets.helmet]: Armor2ModPlugCategories.helmet,
  [LockableBuckets.gauntlets]: Armor2ModPlugCategories.gauntlets,
  [LockableBuckets.chest]: Armor2ModPlugCategories.chest,
  [LockableBuckets.leg]: Armor2ModPlugCategories.leg,
  [LockableBuckets.classitem]: Armor2ModPlugCategories.classitem,
};

/**
 * Filter the items map down given the locking and filtering configs.
 */
export function filterItems(
  items: ItemsByBucket,
  lockedMap: LockedMap,
  lockedArmor2ModMap: LockedArmor2ModMap,
  filter: (item: DimItem) => boolean
): ItemsByBucket {
  const filteredItems: { [bucket: number]: readonly DimItem[] } = {};

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
    const lockedMods = lockedArmor2ModMap[bucketsToCategories[bucket]];

    if (lockedMods?.length || (locked?.length && filteredItems[bucket])) {
      filteredItems[bucket] = filteredItems[bucket].filter(
        (item) =>
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
    case 'burn':
      return getItemDamageShortName(item) === lockedItem.burn.dmg;
    case 'mod':
      return canSlotMod(item, lockedItem);
    case 'perk':
      return (
        item.isDestiny2() &&
        item.sockets &&
        item.sockets.sockets.some((slot) =>
          slot.plugOptions.some((plug) => lockedItem.perk.hash === plug.plugItem.hash)
        )
      );
    case 'item':
      return item.id === lockedItem.item.id;
  }
}
