import * as _ from 'lodash';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { DimSocket } from '../../inventory/item-types';
import { ArmorSet, LockedItemType, MinMax, StatTypes } from '../types';

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
    ].includes(socket.plug.plugItem.plug.plugCategoryHash)
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
  // Sort based on power level
  let sortedSets = _.sortBy(setMap, (set) => -set.power);

  // Sort by highest combined tier
  sortedSets = _.sortBy(
    sortedSets,
    (set) => -(set.tiers[0].Mobility + set.tiers[0].Resilience + set.tiers[0].Recovery)
  );

  // Remove sets that do not match tier filters
  sortedSets = sortedSets.filter((set) => {
    return set.tiers.some((tier) => {
      return (
        stats.Mobility.min <= tier.Mobility &&
        stats.Mobility.max >= tier.Mobility &&
        stats.Resilience.min <= tier.Resilience &&
        stats.Resilience.max >= tier.Resilience &&
        stats.Recovery.min <= tier.Recovery &&
        stats.Recovery.max >= tier.Recovery
      );
    });
  });

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
        if (!item || !item.sockets) {
          return 0;
        }
        return item.sockets.sockets.filter((slot) =>
          slot.plugOptions.some((perk) =>
            lockedPerks.find((lockedPerk) => lockedPerk.item.hash === perk.plugItem.hash)
          )
        ).length;
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
