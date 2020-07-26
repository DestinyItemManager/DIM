import { DimItem } from '../inventory/item-types';
import _ from 'lodash';
import { LockedArmor2ModMap, LockedArmor2Mod } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import {
  getSpecialtySocketMetadata,
  Armor2ModPlugCategories,
  getSpecialtySocketMetadataByPlugCategoryHash,
} from 'app/utils/item-utils';
import { sortProcessModsOrProcessItems } from './processWorker/processUtils';

/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
export const doEnergiesMatch = (mod: LockedArmor2Mod, item: DimItem) =>
  item.isDestiny2() &&
  item.energy &&
  (mod.mod.plug.energyCost.energyType === DestinyEnergyType.Any ||
    mod.mod.plug.energyCost.energyType === item.energy?.energyType);

/**
 * Assignes the general mods to armour pieces in assignments, including the energy specific ones
 * i.e. Void Resist ect
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set.
 *
 * This function need to be kept inline with processWorker/processUtils#canTakeAllGeneralMods.
 */
function assignGeneralMods(
  setToMatch: readonly DimItem[],
  generalMods: LockedArmor2Mod[],
  assignments: Record<number, LockedArmor2Mod[]>
): void {
  const sortedItems = [...setToMatch].sort((a, b) => {
    if (a.isDestiny2() && b.isDestiny2() && a.energy && b.energy) {
      return b.energy.energyType - a.energy.energyType;
    } else if (!a.isDestiny2() || !a.energy) {
      return 1;
    }
    return -1;
  });

  const sortedMods = [...generalMods].sort(
    (a, b) => b.mod.plug.energyCost.energyType - a.mod.plug.energyCost.energyType
  );

  let modIndex = 0;
  let itemIndex = 0;

  // Loop over the items and mods in parallel and see if they can be slotted.
  // due to Any energy mods needing to consider skipped items we reset item index after each splice.
  while (modIndex < sortedMods.length && itemIndex < sortedItems.length) {
    const { energyType } = sortedMods[modIndex].mod.plug.energyCost;
    const item = sortedItems[itemIndex];

    if (
      item.isDestiny2() &&
      (item.energy?.energyType === energyType || energyType === DestinyEnergyType.Any)
    ) {
      sortedItems.splice(itemIndex, 1);
      assignments[item.hash].push(sortedMods[modIndex]);
      modIndex += 1;
      itemIndex = 0;
    } else {
      itemIndex += 1;
    }
  }
}

/**
 * If the energies match, this will assign the mods to the item in assignments.
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set
 */
function assignModsForSlot(
  item: DimItem,
  mods: LockedArmor2Mod[],
  assignments: Record<number, LockedArmor2Mod[]>
): void {
  if (!mods?.length || mods.every((mod) => doEnergiesMatch(mod, item))) {
    assignments[item.hash] = [...assignments[item.hash], ...mods];
  }
}

/**
 * Checks to see if the passed in seasonal mods can be assigned to the armour set.
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set
 *
 * This function need to be kept inline with processWorker/processUtils#canTakeAllSeasonalMods.
 */
function assignAllSeasonalMods(
  setToMatch: readonly DimItem[],
  seasonalMods: readonly LockedArmor2Mod[],
  assignments: Record<number, LockedArmor2Mod[]>
): void {
  // Map the items so we can use the same sorting function as process and get the seasonal data
  const sortedItems = setToMatch
    .map((item) => {
      const seasonalMetadata = getSpecialtySocketMetadata(item);
      return {
        itemHash: item.hash,
        energyType: (item.isDestiny2() && item.energy?.energyType) || undefined,
        season: seasonalMetadata?.season,
        compatibleModSeasons: seasonalMetadata?.compatibleTags,
      };
    })
    .sort(sortProcessModsOrProcessItems);

  // Ditto for mods
  const sortedMods = seasonalMods
    .map((mod) => {
      const seasonalMetadata = getSpecialtySocketMetadataByPlugCategoryHash(
        mod.mod.plug.plugCategoryHash
      );
      return {
        energyType: mod.mod.plug.energyCost.energyType,
        season: seasonalMetadata?.season,
        tag: seasonalMetadata?.tag,
        mod,
      };
    })
    .sort(sortProcessModsOrProcessItems);

  let modIndex = 0;
  let itemIndex = 0;

  // Loop over the items and mods in parallel and see if they can be slotted.
  // due to Any energy mods needing to consider skipped items we reset item index after each splice.
  while (modIndex < sortedMods.length && itemIndex < sortedItems.length) {
    const { energyType, tag, mod } = sortedMods[modIndex];
    const item = sortedItems[itemIndex];

    if (
      (item.energyType === energyType || energyType === DestinyEnergyType.Any) &&
      tag &&
      item.compatibleModSeasons?.includes(tag)
    ) {
      sortedItems.splice(itemIndex, 1);
      assignments[item.itemHash].push(mod);
      modIndex += 1;
      itemIndex = 0;
    } else if (!tag) {
      // This should hopefully never happen but may if mod seasons have an issue.
      // In this case we don't assign the mod and hopefully the user notices.
      modIndex += 1;
      console.warn(`Optimiser: Could not assign mod ${mod.mod.displayProperties.name}`);
    } else {
      itemIndex += 1;
    }
  }
}

export function assignModsToArmorSet(
  setToMatch: readonly DimItem[],
  lockedArmor2Mods: LockedArmor2ModMap
): Record<number, LockedArmor2Mod[]> {
  const assignments: Record<number, LockedArmor2Mod[]> = {};

  for (const item of setToMatch) {
    assignments[item.hash] = [];
  }

  assignGeneralMods(setToMatch, lockedArmor2Mods[Armor2ModPlugCategories.general], assignments);

  assignModsForSlot(setToMatch[0], lockedArmor2Mods[Armor2ModPlugCategories.helmet], assignments);
  assignModsForSlot(
    setToMatch[1],
    lockedArmor2Mods[Armor2ModPlugCategories.gauntlets],
    assignments
  );
  assignModsForSlot(setToMatch[2], lockedArmor2Mods[Armor2ModPlugCategories.chest], assignments);
  assignModsForSlot(setToMatch[3], lockedArmor2Mods[Armor2ModPlugCategories.leg], assignments);
  assignModsForSlot(
    setToMatch[4],
    lockedArmor2Mods[Armor2ModPlugCategories.classitem],
    assignments
  );

  assignAllSeasonalMods(setToMatch, lockedArmor2Mods.seasonal, assignments);

  return assignments;
}
