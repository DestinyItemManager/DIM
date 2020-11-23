import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DimItem } from '../inventory/item-types';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './processWorker/mappers';
import { canTakeAllMods, generateModPermutations } from './processWorker/processUtils';
import { ProcessItem } from './processWorker/types';
import {
  bucketsToCategories,
  LockableBucketHashes,
  LockedArmor2Mod,
  LockedArmor2ModMap,
} from './types';

/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
export const doEnergiesMatch = (mod: LockedArmor2Mod, item: DimItem) =>
  item.energy &&
  (!mod.modDef.plug.energyCost ||
    mod.modDef.plug.energyCost.energyType === DestinyEnergyType.Any ||
    mod.modDef.plug.energyCost.energyType === item.energy?.energyType);

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
  if (mods?.length && mods.every((mod) => doEnergiesMatch(mod, item))) {
    assignments[item.id] = [...assignments[item.id], ...mods.map((mod) => mod.modDef.hash)];
  }
}

/**
 * Checks to see if the passed in general and other mods can be assigned to the armour set.
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set
 */
function assignAllMods(
  setToMatch: ProcessItem[],
  generalMods: LockedArmor2Mod[],
  otherMods: readonly LockedArmor2Mod[],
  raidMods: LockedArmor2Mod[],
  assignments: Record<string, number[]>
): void {
  // Mods need to be sorted before being passed to the assignment function
  const generalProcessMods = generalMods.map(mapArmor2ModToProcessMod);
  const otherProcessMods = otherMods.map(mapArmor2ModToProcessMod);
  const raidProcessMods = raidMods.map(mapArmor2ModToProcessMod);

  const generalModPermutations = generateModPermutations(generalProcessMods);
  const otherModPermutations = generateModPermutations(otherProcessMods);
  const raidModPermutations = generateModPermutations(raidProcessMods);

  canTakeAllMods(
    generalModPermutations,
    otherModPermutations,
    raidModPermutations,
    setToMatch,
    assignments
  );
}

export function assignModsToArmorSet(
  setToMatch: readonly DimItem[],
  lockedArmor2Mods: LockedArmor2ModMap
): [Record<string, LockedArmor2Mod[]>, LockedArmor2Mod[]] {
  const assignments: Record<string, number[]> = {};

  for (const item of setToMatch) {
    assignments[item.id] = [];
  }

  const processItems: ProcessItem[] = [];

  for (const hash of LockableBucketHashes) {
    const item = setToMatch.find((i) => i.bucket.hash === hash);

    if (item) {
      const lockedMods = lockedArmor2Mods[bucketsToCategories[hash]];
      assignModsForSlot(item, lockedMods, assignments);
      processItems.push(mapDimItemToProcessItem(item, lockedMods));
    }
  }

  if (lockedArmor2Mods.other || lockedArmor2Mods[armor2PlugCategoryHashesByName.general].length) {
    assignAllMods(
      processItems,
      lockedArmor2Mods[armor2PlugCategoryHashesByName.general],
      lockedArmor2Mods.other,
      lockedArmor2Mods.raid,
      assignments
    );
  }

  const modsByHash = _.groupBy(Object.values(lockedArmor2Mods).flat(), (mod) => mod.modDef.hash);
  const assignedMods = _.mapValues(assignments, (modHashes) =>
    modHashes
      .map((modHash) => modsByHash[modHash].pop())
      .filter((x): x is LockedArmor2Mod => Boolean(x))
  );
  const assigned = Object.values(assignedMods).flat();
  const unassignedMods = Object.values(lockedArmor2Mods)
    .flat()
    .filter((unassign) => !assigned.some((assign) => assign.key === unassign.key));

  return [assignedMods, unassignedMods];
}
