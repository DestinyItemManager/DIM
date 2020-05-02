import { LockableBuckets, LockedArmor2Mod, LockedArmor2ModMap } from './../types';
import _ from 'lodash';
import { DimSocket, DimItem, D2Item } from '../../inventory/item-types';
import { ArmorSet, LockedItemType, StatTypes, LockedMap, LockedMod, MinMaxIgnored } from '../types';
import { count } from '../../utils/util';
import {
  DestinyInventoryItemDefinition,
  TierType,
  DestinyItemSubType,
  DestinyEnergyType
} from 'bungie-api-ts/destiny2';
import { chainComparator, compareBy, Comparator } from 'app/utils/comparators';
import { statKeys } from '../process';
import { getSpecialtySocketMetadata, Armor2ModPlugCategories } from 'app/utils/item-utils';

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

const energyOrder = [
  DestinyEnergyType.Void,
  DestinyEnergyType.Thermal,
  DestinyEnergyType.Arc,
  DestinyEnergyType.Any
];

/**
 *  Filter out plugs that we don't want to show in the perk picker.
 */
export function filterPlugs(socket: DimSocket) {
  if (!socket.plug) {
    return false;
  }

  const plugItem = socket.plug.plugItem;
  if (!plugItem || !plugItem.plug) {
    return false;
  }

  // Armor 2.0 mods
  if (socket.plug.plugItem.collectibleHash) {
    return false;
  }

  if (
    plugItem.itemSubType === DestinyItemSubType.Ornament ||
    plugItem.itemSubType === DestinyItemSubType.Shader
  ) {
    return false;
  }

  // Remove unwanted sockets by category hash
  if (
    unwantedSockets.has(plugItem.plug.plugCategoryHash) ||
    (plugItem.itemCategoryHashes &&
      (plugItem.itemCategoryHashes.includes(1742617626) || // exotic armor ornanments
      plugItem.itemCategoryHashes.includes(1875601085) || // glows
        plugItem.itemCategoryHashes.includes(1404791674))) // ghost projections
  ) {
    return false;
  }

  // Remove Archetype/Inherit perk
  if (
    plugItem.plug.plugCategoryHash === 1744546145 &&
    plugItem.inventory.tierType !== 6 // keep exotics
  ) {
    return false;
  }

  // Remove empty mod slots
  if (
    plugItem.plug.plugCategoryHash === 3347429529 &&
    plugItem.inventory.tierType === TierType.Basic
  ) {
    return false;
  }

  // Remove masterwork mods and energy mods
  if (plugItem.plug.plugCategoryIdentifier.match(/masterworks/)) {
    return false;
  }

  // Remove empty sockets, which are common tier
  if (plugItem.inventory.tierType === TierType.Common) {
    return false;
  }

  // Only real mods
  if (
    !socket.isPerk &&
    (plugItem.inventory.bucketTypeHash !== 3313201758 || !plugItem.inventory.recoveryBucketTypeHash)
  ) {
    return false;
  }

  return true;
}

function getComparatorsForMatchedSetSorting(statOrder: StatTypes[], enabledStats: Set<StatTypes>) {
  const comparators: Comparator<ArmorSet>[] = [];

  comparators.push(compareBy((s: ArmorSet) => -sumEnabledStats(s.stats, enabledStats)));

  statOrder.forEach((statType) => {
    if (enabledStats.has(statType)) {
      comparators.push(compareBy((s: ArmorSet) => -statTier(s.stats[statType])));
    }
  });

  return comparators;
}

/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
const doEnergiesMatch = (mod: LockedArmor2Mod, item: DimItem) =>
  item.isDestiny2() &&
  item.energy &&
  (mod.mod.plug.energyCost.energyType === DestinyEnergyType.Any ||
    mod.mod.plug.energyCost.energyType === item.energy?.energyType);

/**
 * This function checks if the first valid set in an ArmorSet slot all the mods in
 * seasonalMods.
 *
 * The mods passed in should only be seasonal mods.
 */
function canAllSeasonalModsBeUsed(set: ArmorSet, seasonalMods: readonly LockedArmor2Mod[]) {
  if (seasonalMods.length > 5) {
    return false;
  }

  const modArrays = {};

  // Build up an array of possible mods for each item in the set.
  for (const mod of seasonalMods) {
    for (const item of set.firstValidSet) {
      const itemModCategories =
        getSpecialtySocketMetadata(item)?.compatiblePlugCategoryHashes || [];

      if (itemModCategories.includes(mod.mod.plug.plugCategoryHash) && doEnergiesMatch(mod, item)) {
        if (!modArrays[item.bucket.hash]) {
          modArrays[item.bucket.hash] = [];
        }

        modArrays[item.bucket.hash].push(mod);
      }
    }
  }

  // From the possible mods try and find a combination that includes all seasonal mods
  for (const helmetMod of modArrays[LockableBuckets.helmet] || [null]) {
    for (const armsMod of modArrays[LockableBuckets.gauntlets] || [null]) {
      for (const chestMod of modArrays[LockableBuckets.chest] || [null]) {
        for (const legsMod of modArrays[LockableBuckets.leg] || [null]) {
          for (const classMod of modArrays[LockableBuckets.classitem] || [null]) {
            const applicableMods = [helmetMod, armsMod, chestMod, legsMod, classMod].filter(
              Boolean
            );
            const containsAllLocked = seasonalMods.every((item) => applicableMods.includes(item));

            if (containsAllLocked) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Checks that all the general mods can fit in a set, including the energy specific ones
 * i.e. Void Resist ect
 */
function canAllGeneralModsBeUsed(generalMods: readonly LockedArmor2Mod[], set: ArmorSet): boolean {
  let armour2Count = set.firstValidSet.filter((item) => item.isDestiny2() && item.energy).length;

  if (generalMods && armour2Count < generalMods.length) {
    return false;
  }

  const generalModsByEnergyType = _.groupBy(
    generalMods,
    (mod) => mod.mod.plug.energyCost.energyType
  );

  const armourByEnergyType = _.groupBy(
    set.firstValidSet,
    (item) => item.isDestiny2() && item.energy?.energyType
  );

  //This checks that if there are energy specific mods, they have a corrersponding armour piece
  //  and that after those have been slotted, there are enough pieces to fit the general ones.
  for (const energyType of energyOrder) {
    if (generalModsByEnergyType[energyType]) {
      if (
        energyType === DestinyEnergyType.Any ||
        (armourByEnergyType[energyType] &&
          generalModsByEnergyType[energyType].length <= armourByEnergyType[energyType].length)
      ) {
        armour2Count -= generalModsByEnergyType[energyType].length;
        if (armour2Count < 0) {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  return true;
}

/**
 * Filter sets down based on stat filters, locked perks, etc.
 */
export function filterGeneratedSets(
  sets: readonly ArmorSet[],
  minimumPower: number,
  lockedMap: LockedMap,
  lockedArmor2Mods: LockedArmor2ModMap,
  stats: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>,
  statOrder: StatTypes[],
  enabledStats: Set<StatTypes>
) {
  let matchedSets = Array.from(sets);
  // Filter before set tiers are generated
  matchedSets = matchedSets.filter((set) => {
    if (set.maxPower < minimumPower) {
      return false;
    }

    const firstValidSetArmor2Count = set.firstValidSet.reduce(
      (total, item) => (item.isDestiny2() && item.energy ? total + 1 : total),
      0
    );

    if (
      lockedArmor2Mods.seasonal &&
      (firstValidSetArmor2Count < lockedArmor2Mods.seasonal.length ||
        !canAllSeasonalModsBeUsed(set, lockedArmor2Mods.seasonal))
    ) {
      return false;
    }

    const generalMods = lockedArmor2Mods[Armor2ModPlugCategories.general];
    if (generalMods && !canAllGeneralModsBeUsed(generalMods, set)) {
      return false;
    }

    const doEnergiesClash = (item: DimItem, mods?: readonly LockedArmor2Mod[]): boolean =>
      Boolean(mods?.length && !mods.every((mod) => doEnergiesMatch(mod, item)));

    // ensure all the mods match their respective energy type in on the armour piece
    if (
      doEnergiesClash(set.firstValidSet[0], lockedArmor2Mods[Armor2ModPlugCategories.helmet]) || //helmets
      doEnergiesClash(set.firstValidSet[1], lockedArmor2Mods[Armor2ModPlugCategories.gauntlets]) || //arms
      doEnergiesClash(set.firstValidSet[2], lockedArmor2Mods[Armor2ModPlugCategories.chest]) || //chest
      doEnergiesClash(set.firstValidSet[3], lockedArmor2Mods[Armor2ModPlugCategories.leg]) || //legs
      doEnergiesClash(set.firstValidSet[4], lockedArmor2Mods[Armor2ModPlugCategories.classitem]) //classitem
    ) {
      return false;
    }

    return true;
  });

  matchedSets = matchedSets.sort(
    chainComparator(...getComparatorsForMatchedSetSorting(statOrder, enabledStats))
  );

  matchedSets = getBestSets(matchedSets, lockedMap, stats);

  return matchedSets;
}

/**
 * Get the best sorted computed sets for a specific tier
 */
function getBestSets(
  setMap: readonly ArmorSet[],
  lockedMap: LockedMap,
  stats: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>
): ArmorSet[] {
  // Remove sets that do not match tier filters
  let sortedSets: ArmorSet[];
  if (Object.values(stats).every((s) => s.min === 0 && s.max === 10)) {
    sortedSets = Array.from(setMap);
  } else {
    sortedSets = setMap.filter((set) =>
      _.every(stats, (value, key) => {
        const tier = statTier(set.stats[key]);
        return value.ignored || (value.min <= tier && value.max >= tier);
      })
    );
  }

  // Prioritize list based on number of matched perks
  Object.keys(lockedMap).forEach((bucket) => {
    const bucketHash = parseInt(bucket, 10);
    const locked = lockedMap[bucketHash];
    // if there are locked perks for this bucket
    if (!locked) {
      return;
    }
    const lockedPerks = locked.filter((lockedItem) => lockedItem.type === 'perk');
    if (!lockedPerks.length) {
      return;
    }
    // Sort based on what sets have the most matched perks
    sortedSets = _.sortBy(
      sortedSets,
      (set) =>
        -_.sumBy(set.firstValidSet, (firstItem) => {
          if (!firstItem || !firstItem.isDestiny2() || !firstItem.sockets) {
            return 0;
          }
          return count(firstItem.sockets.sockets, (slot) =>
            slot.plugOptions.some((perk) =>
              lockedPerks.some(
                (lockedPerk) =>
                  lockedPerk.type === 'perk' && lockedPerk.perk.hash === perk.plugItem.hash
              )
            )
          );
        })
    );
  });

  return sortedSets;
}

/**
 * Add a locked item to the locked item list for a bucket.
 */
export function addLockedItem(
  lockedItem: LockedItemType,
  locked: readonly LockedItemType[] = []
): readonly LockedItemType[] | undefined {
  // Locking an item clears out the other locked properties in that bucket
  if (lockedItem.type === 'item') {
    return [lockedItem];
  }

  // there can only be one burn type per bucket
  if (lockedItem.type === 'burn') {
    const newLockedItems = locked.filter((li) => li.type !== 'burn');
    newLockedItems.push(lockedItem);
    return newLockedItems;
  }

  // Only add if it's not already there.
  if (!locked.some((existing) => lockedItemsEqual(existing, lockedItem))) {
    const newLockedItems = Array.from(locked);
    newLockedItems.push(lockedItem);
    return newLockedItems;
  }

  return locked.length === 0 ? undefined : locked;
}

/**
 * Remove a locked item from the locked item list for a bucket.
 */
export function removeLockedItem(
  lockedItem: LockedItemType,
  locked: readonly LockedItemType[] = []
): readonly LockedItemType[] | undefined {
  // Filter anything equal to the passed in item
  const newLockedItems = locked.filter((existing) => !lockedItemsEqual(existing, lockedItem));
  return newLockedItems.length === 0 ? undefined : newLockedItems;
}

export function lockedItemsEqual(first: LockedItemType, second: LockedItemType) {
  switch (first.type) {
    case 'item':
      return second.type === 'item' && first.item.id === second.item.id;
    case 'exclude':
      return second.type === 'exclude' && first.item.id === second.item.id;
    case 'mod':
      return second.type === 'mod' && first.mod.hash === second.mod.hash;
    case 'perk':
      return second.type === 'perk' && first.perk.hash === second.perk.hash;
    case 'burn':
      return second.type === 'burn' && first.burn.dmg === second.burn.dmg;
  }
}

/**
 * Calculate the number of valid permutations of a stat mix, without enumerating them.
 */
export function getNumValidSets(armors: readonly DimItem[][]) {
  const exotics = new Array(armors.length).fill(0);
  const nonExotics = new Array(armors.length).fill(0);
  let index = 0;
  for (const armor of armors) {
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
  for (index = 0; index < armors.length; index++) {
    total += exotics[index]
      ? nonExotics.reduce((memo, num, idx) => (idx === index ? exotics[idx] : num) * memo, 1)
      : 0;
  }

  return total;
}

/**
 * filteredPerks:
 * The input perks, filtered down to perks on items that also include the other selected perks in that bucket.
 * For example, if you'd selected "heavy ammo finder" for class items it would only include perks that are on
 * class items that also had "heavy ammo finder".
 *
 * filteredPlugSetHashes:
 * Plug set hashes that contain the mods that can slot into items that can also slot the other selected mods in that bucket.
 * For example, if you'd selected "scout rifle loader" for gauntlets it would only include mods that can slot on
 * gauntlets that can also slot "scout rifle loader".
 */
export function getFilteredPerksAndPlugSets(
  locked: readonly LockedItemType[] | undefined,
  items: readonly DimItem[]
) {
  const filteredPlugSetHashes = new Set<number>();
  const filteredPerks = new Set<DestinyInventoryItemDefinition>();

  if (!locked) {
    return {};
  }

  for (const item of items) {
    // flat list of plugs per item
    const itemPlugs: DestinyInventoryItemDefinition[] = [];
    // flat list of plugSetHashes per item
    const itemPlugSets: number[] = [];

    if (item.isDestiny2() && item.sockets) {
      for (const socket of item.sockets.sockets) {
        // Populate mods
        if (!socket.isPerk) {
          if (socket.socketDefinition.reusablePlugSetHash) {
            itemPlugSets.push(socket.socketDefinition.reusablePlugSetHash);
          } else if (socket.socketDefinition.randomizedPlugSetHash) {
            itemPlugSets.push(socket.socketDefinition.randomizedPlugSetHash);
          }
        }

        // Populate plugs
        if (filterPlugs(socket)) {
          socket.plugOptions.forEach((option) => {
            itemPlugs.push(option.plugItem);
          });
        }
      }
    }

    // The item must be able to slot all mods
    let matches = true;
    for (const lockedItem of locked) {
      if (lockedItem.type === 'mod') {
        const mod = lockedItem.mod;
        if (item.isDestiny2() && matchesEnergy(item, mod)) {
          const plugSetIndex = itemPlugSets.indexOf(lockedItem.plugSetHash);
          if (plugSetIndex >= 0) {
            // Remove this plugSetHash from the list because it is now "occupied"
            itemPlugSets.splice(plugSetIndex, 1);
          } else {
            matches = false;
            break;
          }
        } else {
          matches = false;
          break;
        }
      }
    }

    // for each item, look to see if all perks match locked
    matches =
      matches &&
      locked.every(
        (locked) =>
          locked.type !== 'perk' || itemPlugs.some((plug) => plug.hash === locked.perk.hash)
      );

    // It matches all perks and plugs
    if (matches) {
      for (const plugSetHash of itemPlugSets) {
        filteredPlugSetHashes.add(plugSetHash);
      }
      for (const itemPlug of itemPlugs) {
        filteredPerks.add(itemPlug);
      }
    }
  }

  return { filteredPlugSetHashes, filteredPerks };
}

function matchesEnergy(item: D2Item, mod: DestinyInventoryItemDefinition) {
  return (
    !mod.plug ||
    !mod.plug.energyCost ||
    !item.energy ||
    mod.plug.energyCost.energyType === item.energy.energyType ||
    mod.plug.energyCost.energyType === DestinyEnergyType.Any
  );
}

/**
 * Can this mod be slotted onto this item?
 */
export function canSlotMod(item: DimItem, lockedItem: LockedMod) {
  const mod = lockedItem.mod;
  return (
    item.isDestiny2() &&
    matchesEnergy(item, mod) &&
    // Matches socket plugsets
    item.sockets &&
    item.sockets.sockets.some(
      (socket) =>
        (socket.socketDefinition.reusablePlugSetHash &&
          lockedItem.plugSetHash === socket.socketDefinition.reusablePlugSetHash) ||
        (socket.socketDefinition.randomizedPlugSetHash &&
          lockedItem.plugSetHash === socket.socketDefinition.randomizedPlugSetHash)
    )
  );
}

/** Whether this item is eligible for being in loadout builder */
export function isLoadoutBuilderItem(item: DimItem) {
  // Armor and Ghosts
  return item.bucket.inArmor || item.bucket.hash === 4023194814;
}

/**
 * The "Tier" of a set takes into account that each stat only ticks over to a new effective value
 * every 10.
 */
export function calculateTotalTier(stats: ArmorSet['stats']) {
  return _.sum(Object.values(stats).map(statTier));
}

export function sumEnabledStats(stats: ArmorSet['stats'], enabledStats: Set<StatTypes>) {
  return _.sumBy(statKeys, (statType) =>
    enabledStats.has(statType) ? statTier(stats[statType]) : 0
  );
}

export function statTier(stat: number) {
  return Math.floor(stat / 10);
}
