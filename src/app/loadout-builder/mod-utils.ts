import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DimItem } from '../inventory/item-types';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './processWorker/mappers';
import { canTakeAllMods, generateModPermutations } from './processWorker/processUtils';
import { ProcessItem } from './processWorker/types';
import {
  bucketsToCategories,
  knownModPlugCategoryHashes,
  LockableBucketHashes,
  LockedArmor2Mod,
  LockedArmor2ModMap,
  raidPlugCategoryHashes,
} from './types';

/**
 * Gets a flat list of all the mods that fit into the raid item socket.
 */
export function getRaidMods(lockedArmor2ModMap: LockedArmor2ModMap) {
  let raidMods: LockedArmor2Mod[] = [];

  for (const [plugCategoryHash, mods] of Object.entries(lockedArmor2ModMap)) {
    if (mods && raidPlugCategoryHashes.includes(Number(plugCategoryHash))) {
      raidMods = raidMods.concat(mods);
    }
  }

  return raidMods;
}

/**
 * Gets a flat list of all the mods which don't fit into general, slot specific or raid
 * sockets. This should be combat and legacy mods.
 */
export function getOtherMods(lockedArmor2ModMap: LockedArmor2ModMap) {
  let otherMods: LockedArmor2Mod[] = [];

  for (const [plugCategoryHash, mods] of Object.entries(lockedArmor2ModMap)) {
    if (mods && !knownModPlugCategoryHashes.includes(Number(plugCategoryHash))) {
      otherMods = otherMods.concat(mods);
    }
  }

  return otherMods;
}

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
  assignments: Record<string, number[]>,
  mods?: LockedArmor2Mod[]
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
      assignModsForSlot(item, assignments, lockedMods);
      processItems.push(mapDimItemToProcessItem(item, lockedMods));
    }
  }

  const generalMods = lockedArmor2Mods[armor2PlugCategoryHashesByName.general] || [];
  const otherMods = getOtherMods(lockedArmor2Mods);
  const raidMods = getRaidMods(lockedArmor2Mods);

  if (otherMods.length || raidMods.length || generalMods.length) {
    assignAllMods(processItems, generalMods, otherMods, raidMods, assignments);
  }

  const modsByHash = _.groupBy(
    Object.values(lockedArmor2Mods)
      .flat()
      .filter((x: LockedArmor2Mod | undefined): x is LockedArmor2Mod => Boolean(x)),
    (mod) => mod.modDef.hash
  );
  const assignedMods = _.mapValues(assignments, (modHashes) =>
    modHashes
      .map((modHash) => modsByHash[modHash].pop())
      .filter((x): x is LockedArmor2Mod => Boolean(x))
  );
  const assigned = Object.values(assignedMods).flat();
  const unassignedMods = Object.values(lockedArmor2Mods)
    .flat()
    .filter((unassign): unassign is LockedArmor2Mod =>
      Boolean(unassign && !assigned.some((assign) => assign.key === unassign.key))
    );

  return [assignedMods, unassignedMods];
}
