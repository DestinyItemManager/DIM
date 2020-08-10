import { DimItem, D2Item } from '../inventory/item-types';
import _ from 'lodash';
import { LockedArmor2ModMap, LockedArmor2Mod } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import {
  sortProcessModsOrProcessItems,
  canTakeAllSeasonalMods,
  canTakeAllGeneralMods,
} from './processWorker/processUtils';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './processWorker/mappers';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { ProcessItem } from './processWorker/types';

/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
export const doEnergiesMatch = (mod: LockedArmor2Mod, item: DimItem) =>
  item.isDestiny2() &&
  item.energy &&
  (mod.mod.plug.energyCost!.energyType === DestinyEnergyType.Any ||
    mod.mod.plug.energyCost!.energyType === item.energy?.energyType);

/**
 * Assignes the general mods to armour pieces in assignments, including the energy specific ones
 * i.e. Void Resist ect
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set.
 */
function assignGeneralMods(
  setToMatch: ProcessItem[],
  generalMods: LockedArmor2Mod[],
  assignments: Record<string, number[]>
): void {
  // Mods need to be sorted before being passed to the assignment function
  const sortedMods = generalMods.map(mapArmor2ModToProcessMod).sort(sortProcessModsOrProcessItems);

  canTakeAllGeneralMods(sortedMods, setToMatch, assignments);
}

/**
 * If the energies match, this will assign the mods to the item in assignments.
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set
 */
function assignModsForSlot(
  item: DimItem,
  mods: LockedArmor2Mod[],
  assignments: Record<string, number[]>
): void {
  if (!mods?.length || mods.every((mod) => doEnergiesMatch(mod, item))) {
    assignments[item.id] = [...assignments[item.id], ...mods.map((mod) => mod.mod.hash)];
  }
}

/**
 * Checks to see if the passed in seasonal mods can be assigned to the armour set.
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set
 */
function assignAllSeasonalMods(
  setToMatch: ProcessItem[],
  seasonalMods: readonly LockedArmor2Mod[],
  assignments: Record<string, number[]>
): void {
  // Mods need to be sorted before being passed to the assignment function
  const sortedMods = seasonalMods.map(mapArmor2ModToProcessMod).sort(sortProcessModsOrProcessItems);

  canTakeAllSeasonalMods(sortedMods, setToMatch, assignments);
}

export function assignModsToArmorSet(
  setToMatch: readonly DimItem[],
  lockedArmor2Mods: LockedArmor2ModMap
): Record<string, LockedArmor2Mod[]> {
  const assignments: Record<string, number[]> = {};

  for (const item of setToMatch) {
    if (!item.isDestiny2()) {
      return {};
    } else {
      assignments[item.id] = [];
    }
  }

  const [helmet, arms, chest, legs, classItem] = setToMatch as D2Item[];

  assignModsForSlot(helmet, lockedArmor2Mods[armor2PlugCategoryHashesByName.helmet], assignments);
  assignModsForSlot(arms, lockedArmor2Mods[armor2PlugCategoryHashesByName.gauntlets], assignments);
  assignModsForSlot(chest, lockedArmor2Mods[armor2PlugCategoryHashesByName.chest], assignments);
  assignModsForSlot(legs, lockedArmor2Mods[armor2PlugCategoryHashesByName.leg], assignments);
  assignModsForSlot(
    classItem,
    lockedArmor2Mods[armor2PlugCategoryHashesByName.classitem],
    assignments
  );

  const processItems = [
    mapDimItemToProcessItem(helmet, lockedArmor2Mods[armor2PlugCategoryHashesByName.helmet]),
    mapDimItemToProcessItem(arms, lockedArmor2Mods[armor2PlugCategoryHashesByName.gauntlets]),
    mapDimItemToProcessItem(chest, lockedArmor2Mods[armor2PlugCategoryHashesByName.chest]),
    mapDimItemToProcessItem(legs, lockedArmor2Mods[armor2PlugCategoryHashesByName.leg]),
    mapDimItemToProcessItem(classItem, lockedArmor2Mods[armor2PlugCategoryHashesByName.classitem]),
  ];

  assignAllSeasonalMods(processItems, lockedArmor2Mods.seasonal, assignments);

  assignGeneralMods(
    processItems,
    lockedArmor2Mods[armor2PlugCategoryHashesByName.general],
    assignments
  );

  const modsByHash = _.keyBy(Object.values(lockedArmor2Mods).flat(), (mod) => mod.mod.hash);
  return _.mapValues(assignments, (modHashes) => modHashes.map((modHash) => modsByHash[modHash]));
}
