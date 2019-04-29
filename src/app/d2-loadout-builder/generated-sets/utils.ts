import _ from 'lodash';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { DimSocket, D2Item } from '../../inventory/item-types';
import { ArmorSet, LockedItemType, MinMax, StatTypes } from '../types';
import { count } from '../../util';
import { DestinyInventoryItemDefinition, DestinyClass } from 'bungie-api-ts/destiny2';

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

export function filterGeneratedSets(
  sets: readonly ArmorSet[],
  minimumPower: number,
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>,
  stats: Readonly<{ [statType in StatTypes]: MinMax }>
) {
  let matchedSets = sets;
  // Filter before set tiers are generated
  if (minimumPower > 0) {
    matchedSets = matchedSets.filter((set) => getPower(set) >= minimumPower);
  }

  // TODO: cutoff sets under highest Tier?

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

// TODO: store the locked items directly and derive locked perks
export function toggleLockedItem(
  lockedItem: LockedItemType,
  bucket: InventoryBucket,
  onLockChanged: (bucket: InventoryBucket, locked?: LockedItemType[]) => void,
  locked?: readonly LockedItemType[]
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

export function getPower(set: ArmorSet) {
  const bestSet = getFirstValidSet(set);
  return bestSet ? getPowerForItems(bestSet) : 0;
}

export function getPowerForItems(items: D2Item[]) {
  return Math.floor(_.sumBy(items, (i) => i.basePower) / items.length);
}

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
    total += nonExotics.reduce((memo, num, idx) => (idx === index ? exotics[idx] : num) * memo, 1);
  }

  return total;
}

export function getValidSets(set: ArmorSet) {
  const sets: D2Item[][] = [];
  for (const helm of set.armor[0]) {
    for (const gaunt of set.armor[1]) {
      for (const chest of set.armor[2]) {
        for (const leg of set.armor[3]) {
          for (const classItem of set.armor[4]) {
            const armor = [helm, gaunt, chest, leg, classItem];
            if (_.uniqBy(armor, (i) => i.equippingLabel || i.id).length === armor.length) {
              sets.push(armor);
            }
          }
        }
      }
    }
  }
  return _.sortBy(sets, getPowerForItems);
}

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
    exoticIndices.shift();
    const firstValid = set.armor.map((a, i) =>
      exoticIndices.includes(i) ? a.find((item) => !item.equippingLabel) : a[0]
    );
    if (firstValid.some((i) => !i)) {
      return undefined;
    }
    return _.compact(firstValid);
  } else {
    return set.armor.map((a) => a[0]);
  }
}

export function getFilteredAndSelectedPerks(
  storeClass: DestinyClass,
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>,
  items: Readonly<{
    [classType: number]: Readonly<{
      [bucketHash: number]: Readonly<{ [itemHash: number]: readonly D2Item[] }>;
    }>;
  }>
): {
  selectedPerks: ReadonlySet<number>;
  filteredPerks: Readonly<{ [bucketHash: number]: ReadonlySet<DestinyInventoryItemDefinition> }>;
} {
  // filter down perks to only what is selectable
  const filteredPerks: { [bucketHash: number]: Set<DestinyInventoryItemDefinition> } = {};
  // TODO: we should take in existing selected perks?
  const selectedPerks = new Set<number>([]);

  // loop all buckets
  Object.keys(items[storeClass]).forEach((bucket) => {
    if (!lockedMap[bucket]) {
      return;
    }
    filteredPerks[bucket] = new Set<DestinyInventoryItemDefinition>();
    const lockedPlugs = lockedMap[bucket].filter(
      (locked: LockedItemType) => locked.type === 'perk'
    );

    // save a flat copy of all selected perks
    lockedPlugs.forEach((lockedItem) => {
      selectedPerks.add((lockedItem.item as DestinyInventoryItemDefinition).index);
    });
    // loop all items by hash
    Object.keys(items[storeClass][bucket]).forEach((itemHash) => {
      const itemInstances = items[storeClass][bucket][itemHash];

      // loop all items by instance
      itemInstances.forEach((item) => {
        // flat list of plugs per item
        const itemPlugs: DestinyInventoryItemDefinition[] = [];
        item.sockets &&
          item.sockets.sockets.filter(filterPlugs).forEach((socket) => {
            socket.plugOptions.forEach((option) => {
              itemPlugs.push(option.plugItem);
            });
          });
        // for each item, look to see if all perks match locked
        const matched = lockedPlugs.every((locked: LockedItemType) =>
          itemPlugs.find((plug) => plug.index === locked.item.index)
        );
        if (item.sockets && matched) {
          itemPlugs.forEach((plug) => {
            filteredPerks[bucket].add(plug);
          });
        }
      });
    });
  });

  return { filteredPerks, selectedPerks };
}
