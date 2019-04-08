import _ from 'lodash';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { DimSocket } from '../../inventory/item-types';
import { ArmorSet, LockedItemType, MinMax, StatTypes } from '../types';
import { count } from '../../util';

/**
 *  Filter out plugs that we don't want to show in the perk dropdown.
 */
export function filterPlugs(socket: DimSocket) {
  if (!socket.plug) {
    return false;
  }

  // Remove unwanted sockets by category hash
  if (
    [
      3313201758, // Mobility, Restorative, and Resilience perks
      1514141499, // Void damage resistance
      1514141501, // Arc damage resistance
      1514141500, // Solar damage resistance
      2973005342, // Shaders
      3356843615, // Ornaments
      2457930460 // Empty masterwork slot
    ].includes(socket.plug.plugItem.plug.plugCategoryHash) ||
    socket.plug.plugItem.itemCategoryHashes.includes(1742617626) // exotic armor ornanments
  ) {
    return false;
  }

  // Remove Archetype/Inherit perk
  if (
    socket.plug.plugItem.plug.plugCategoryHash === 1744546145 &&
    socket.plug.plugItem.inventory.tierType !== 6 // keep exotics
  ) {
    return false;
  }

  // Remove empty mod slots
  if (
    socket.plug.plugItem.plug.plugCategoryHash === 3347429529 &&
    socket.plug.plugItem.inventory.tierType === 2
  ) {
    return false;
  }
  return true;
}

/**
 * Get the best sorted computed sets for a specfic tier
 */
export function getBestSets(
  setMap: ArmorSet[],
  lockedMap: { [bucketHash: number]: LockedItemType[] },
  stats: { [statType in StatTypes]: MinMax }
): ArmorSet[] {
  // Remove sets that do not match tier filters
  let sortedSets: ArmorSet[];
  if (
    stats.Mobility.min === 0 &&
    stats.Resilience.min === 0 &&
    stats.Recovery.min === 0 &&
    stats.Mobility.max === 10 &&
    stats.Resilience.max === 10 &&
    stats.Recovery.max === 10
  ) {
    sortedSets = Array.from(setMap);
  } else {
    sortedSets = setMap.filter((set) => {
      return (
        stats.Mobility.min <= set.stats.Mobility &&
        stats.Mobility.max >= set.stats.Mobility &&
        stats.Resilience.min <= set.stats.Resilience &&
        stats.Resilience.max >= set.stats.Resilience &&
        stats.Recovery.min <= set.stats.Recovery &&
        stats.Recovery.max >= set.stats.Recovery
      );
    });
  }

  // Prioritize list based on number of matched perks
  Object.keys(lockedMap).forEach((bucket) => {
    // if there are locked perks for this bucket
    if (lockedMap[bucket] === undefined) {
      return;
    }
    const lockedPerks = lockedMap[bucket].filter((lockedItem) => lockedItem.type === 'perk');
    if (!lockedPerks.length) {
      return;
    }
    // Sort based on what sets have the most matched perks
    sortedSets = _.sortBy(sortedSets, (set) => {
      return -_.sumBy(set.armor, (item) => {
        if (!item[0] || !item[0].sockets) {
          return 0;
        }
        return count(item[0].sockets.sockets, (slot) =>
          slot.plugOptions.some((perk) =>
            lockedPerks.some((lockedPerk) => lockedPerk.item.hash === perk.plugItem.hash)
          )
        );
      });
    });
  });

  return sortedSets;
}

export function toggleLockedItem(
  lockedItem: LockedItemType,
  bucket: InventoryBucket,
  onLockChanged: (bucket: InventoryBucket, locked?: LockedItemType[]) => void,
  locked?: LockedItemType[]
) {
  if (locked && locked[0].type === 'item') {
    onLockChanged(
      bucket,
      lockedItem.item.index === locked[0].item.index ? undefined : [lockedItem]
    );
  }

  const newLockedItems: LockedItemType[] = Array.from(locked || []);

  const existingIndex = newLockedItems.findIndex(
    (existing) => existing.item.index === lockedItem.item.index
  );
  if (existingIndex > -1) {
    newLockedItems.splice(existingIndex, 1);
  } else {
    newLockedItems.push(lockedItem);
  }

  onLockChanged(bucket, newLockedItems.length === 0 ? undefined : newLockedItems);
}
