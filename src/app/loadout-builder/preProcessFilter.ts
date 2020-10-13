import { DimItem } from 'app/inventory/item-types';
import { ItemFilter } from 'app/search/filter-types';
import { getMasterworkSocketHashes } from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { doEnergiesMatch, isEnergyLower } from './mod-utils';
import {
  bucketsToCategories,
  ItemsByBucket,
  LockableBuckets,
  LockedArmor2ModMap,
  LockedItemType,
  LockedMap,
  statValues,
} from './types';

/**
 * Filter the items map down given the locking and filtering configs.
 */
export function filterItems(
  items: ItemsByBucket | undefined,
  lockedMap: LockedMap,
  lockedArmor2ModMap: LockedArmor2ModMap,
  minimumStatTotal: number,
  assumeMasterwork: boolean,
  ignoreAffinity: boolean,
  maximumEnergy: number,
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

  // filter to only include items that are in the locked map and items that have the correct energy unless we're ignoring armor element
  Object.values(LockableBuckets).forEach((bucket) => {
    const locked = lockedMap[bucket];
    const lockedMods = lockedArmor2ModMap[bucketsToCategories[bucket]];

    if (filteredItems[bucket]) {
      filteredItems[bucket] = filteredItems[bucket].filter(
        (item) =>
          // handle locked items and mods cases
          (!locked || locked.every((lockedItem) => matchLockedItem(item, lockedItem))) &&
          (!lockedMods ||
            (ignoreAffinity && isEnergyLower(item, maximumEnergy)) ||
            lockedMods.every((mod) => doEnergiesMatch(mod, item))) &&
          // if the item is not a class item, and its not locked, make sure it meets the minimum total stat without locked mods
          (bucket === LockableBuckets.classitem ||
            locked?.length ||
            getTotalBaseStatsWithMasterwork(item, assumeMasterwork) >= minimumStatTotal)
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

/**
 * This gets the total of the base stats plus any masterwork values. The two cases for masterwork values are,
 * 1. When assume masterwork is selected we add 2 onto each stat of each armour item
 * 2. When not assume masterwork we add on the the masterwork stat values for any items that have actually
 *   been masterworked since it cannot be removed from the item.
 */
export function getTotalBaseStatsWithMasterwork(item: DimItem, assumeMasterwork: boolean | null) {
  const stats = _.keyBy(item.stats, (stat) => stat.statHash);
  const baseStats = {};

  for (const statHash of statValues) {
    baseStats[statHash] = stats[statHash]?.base || 0;
  }

  // Checking energy tells us if it is Armour 2.0
  if (item.sockets && item.energy) {
    if (assumeMasterwork) {
      for (const statHash of statValues) {
        baseStats[statHash] += 2;
      }
    } else {
      // If not assume masterwork add on mw stats as they can't be removed.
      const masterworkSocketHashes = getMasterworkSocketHashes(
        item.sockets,
        DestinySocketCategoryStyle.EnergyMeter
      );

      for (const socket of item.sockets.allSockets) {
        const plugHash = socket?.plugged?.plugDef?.hash ?? NaN;

        if (socket.plugged?.stats && !masterworkSocketHashes.includes(plugHash)) {
          for (const statHash of statValues) {
            if (socket.plugged.stats[statHash]) {
              baseStats[statHash] += socket.plugged.stats[statHash];
            }
          }
        }
      }
    }
  }

  return _.sum(statValues.map((statHash) => Math.max(baseStats[statHash], 0)));
}
