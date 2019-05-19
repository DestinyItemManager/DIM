import _ from 'lodash';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { DimSocket, D2Item } from '../../inventory/item-types';
import { ArmorSet, LockedItemType, MinMax, StatTypes, ItemsByClass } from '../types';
import { count } from '../../util';
import { DestinyInventoryItemDefinition, DestinyClass } from 'bungie-api-ts/destiny2';
import { chainComparator, compareBy } from 'app/comparators';

/**
 * Plug item hashes that should be excluded from the list of selectable perks.
 */
const unwantedSockets = new Set([
  3313201758, // Mobility, Restorative, and Resilience perks
  1514141499, // Void damage resistance
  1514141501, // Arc damage resistance
  1514141500, // Solar damage resistance
  2973005342, // Shaders
  3356843615, // Ornaments
  2457930460 // Empty masterwork slot
]);

/**
 *  Filter out plugs that we don't want to show in the perk picker.
 */
export function filterPlugs(socket: DimSocket) {
  if (!socket.plug) {
    return false;
  }

  // Remove unwanted sockets by category hash
  if (
    unwantedSockets.has(socket.plug.plugItem.plug.plugCategoryHash) ||
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
 * Filter sets down based on stat filters, locked perks, etc.
 */
export function filterGeneratedSets(
  sets: readonly ArmorSet[],
  minimumPower: number,
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>,
  stats: Readonly<{ [statType in StatTypes]: MinMax }>,
  statOrder: StatTypes[]
) {
  let matchedSets = Array.from(sets);
  // Filter before set tiers are generated
  if (minimumPower > 0) {
    matchedSets = matchedSets.filter((set) => getPower(set) >= minimumPower);
  }

  // TODO: cutoff sets under highest Tier?

  matchedSets = matchedSets.sort(
    chainComparator(
      compareBy(
        (s: ArmorSet) =>
          // Total tier
          -(s.stats.Mobility + s.stats.Recovery + s.stats.Resilience)
      ),
      ...statOrder.map((stat) => compareBy((s: ArmorSet) => -s.stats[stat]))
    )
  );

  matchedSets = getBestSets(matchedSets, lockedMap, stats);

  return matchedSets;
}

/**
 * Get the best sorted computed sets for a specfic tier
 */
function getBestSets(
  setMap: readonly ArmorSet[],
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>,
  stats: Readonly<{ [statType in StatTypes]: MinMax }>
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
    const bucketHash = parseInt(bucket, 10);
    // if there are locked perks for this bucket
    if (lockedMap[bucketHash] === undefined) {
      return;
    }
    const lockedPerks = lockedMap[bucketHash].filter((lockedItem) => lockedItem.type === 'perk');
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
            lockedPerks.some(
              (lockedPerk) =>
                lockedPerk.type === 'perk' && lockedPerk.perk.hash === perk.plugItem.hash
            )
          )
        );
      });
    });
  });

  return sortedSets;
}

/**
 * Toggle locking an item or perk.
 */
export function toggleLockedItem(
  lockedItem: LockedItemType,
  bucket: InventoryBucket,
  onLockChanged: (bucket: InventoryBucket, locked?: LockedItemType[]) => void,
  locked?: readonly LockedItemType[]
) {
  if (locked && locked.length) {
    const firstLocked = locked[0];
    if (firstLocked.type === 'item') {
      onLockChanged(
        bucket,
        lockedItem.type === 'item' && lockedItem.item.id === firstLocked.item.id
          ? undefined
          : [lockedItem]
      );
    }
  }

  const newLockedItems: LockedItemType[] = Array.from(locked || []);

  const existingIndex = newLockedItems.findIndex((existing) =>
    (existing.type === 'item' && lockedItem.type === 'item') ||
    (existing.type === 'exclude' && lockedItem.type === 'exclude')
      ? existing.item.id === lockedItem.item.id
      : existing.type === 'perk' && lockedItem.type === 'perk'
      ? existing.perk.hash === lockedItem.perk.hash
      : false
  );
  if (existingIndex > -1) {
    newLockedItems.splice(existingIndex, 1);
  } else {
    newLockedItems.push(lockedItem);
  }

  onLockChanged(bucket, newLockedItems.length === 0 ? undefined : newLockedItems);
}

/**
 * Get the maximum average power for a particular stat mix.
 */
export function getPower(set: ArmorSet) {
  const bestSet = getFirstValidSet(set);
  return bestSet ? getPowerForItems(bestSet) : 0;
}

/**
 * Calculate the average power for a list of items.
 */
export function getPowerForItems(items: D2Item[]) {
  return Math.floor(_.sumBy(items, (i) => i.basePower) / items.length);
}

/**
 * Calculate the number of valid permutations of a stat mix, without enumerating them.
 */
export function getNumValidSets(set: ArmorSet) {
  const exotics = new Array(set.armor.length).fill(0);
  const nonExotics = new Array(set.armor.length).fill(0);
  let index = 0;
  for (const armor of set.armor) {
    for (const item of armor) {
      if (item.equippingLabel) {
        exotics[index]++;
      } else {
        nonExotics[index]++;
      }
    }
    index++;
  }

  // Sets that are all legendary
  let total = nonExotics.reduce((memo, num) => num * memo, 1);
  // Sets that include one exotic
  for (index = 0; index < set.armor.length; index++) {
    total += exotics[index]
      ? nonExotics.reduce((memo, num, idx) => (idx === index ? exotics[idx] : num) * memo, 1)
      : 0;
  }

  return total;
}

/**
 * Get the loadout permutation for this stat mix that has the highest power, assuming the
 * items in each slot are already sorted by power. This respects the rule that two exotics
 * cannot be equipped at once.
 */
export function getFirstValidSet(set: ArmorSet) {
  let exoticIndices: number[] = [];
  let index = 0;
  for (const armor of set.armor) {
    if (armor[0].equippingLabel) {
      exoticIndices.push(index);
    }
    index++;
  }

  if (exoticIndices.length > 1) {
    exoticIndices = _.sortBy(exoticIndices, (i) => set.armor[i][0].basePower);
    for (let numExotics = exoticIndices.length; numExotics > 0; numExotics--) {
      // Start by trying to substitute the least powerful exotic
      const fixedIndex = exoticIndices.shift()!;
      // For each remaining exotic, try to find a non-exotic in its place
      const firstValid = set.armor.map((a, i) =>
        exoticIndices.includes(i) ? a.find((item) => !item.equippingLabel) : a[0]
      );
      // If we found something for every slot
      if (firstValid.every(Boolean)) {
        return _.compact(firstValid);
      }
      // Put it back on the end
      exoticIndices.push(fixedIndex);
    }
    return undefined;
  } else {
    return set.armor.map((a) => a[0]);
  }
}

/**
 * The input perks, filtered down to perks on items that also include the other selected perks in that bucket.
 * For example, if you'd selected "heavy ammo finder" for class items it would only include perks that are on
 * class items that also had "heavy ammo finder".
 */
export function getFilteredPerks(
  storeClass: DestinyClass,
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>,
  items: ItemsByClass
): Readonly<{ [bucketHash: number]: ReadonlySet<DestinyInventoryItemDefinition> }> {
  // filter down perks to only what is selectable
  const filteredPerks: { [bucketHash: number]: Set<DestinyInventoryItemDefinition> } = {};

  // loop all buckets
  Object.keys(items[storeClass]).forEach((bucket) => {
    const bucketHash = parseInt(bucket, 10);
    if (!lockedMap[bucketHash]) {
      return;
    }
    filteredPerks[bucketHash] = new Set<DestinyInventoryItemDefinition>();

    // loop all items by hash
    items[storeClass][bucketHash].forEach((item) => {
      // flat list of plugs per item
      const itemPlugs: DestinyInventoryItemDefinition[] = [];
      item.sockets &&
        item.sockets.sockets.filter(filterPlugs).forEach((socket) => {
          socket.plugOptions.forEach((option) => {
            itemPlugs.push(option.plugItem);
          });
        });
      // for each item, look to see if all perks match locked
      const matched = lockedMap[bucketHash].every(
        (locked) =>
          locked.type !== 'perk' || itemPlugs.some((plug) => plug.hash === locked.perk.hash)
      );
      if (item.sockets && matched) {
        itemPlugs.forEach((plug) => {
          filteredPerks[bucket].add(plug);
        });
      }
    });
  });

  return filteredPerks;
}

/** Whether this item is eligible for being in loadout builder */
export function isLoadoutBuilderItem(item: D2Item) {
  // Armor and Ghosts
  return item.sockets && (item.bucket.inArmor || item.bucket.hash === 4023194814);
}
