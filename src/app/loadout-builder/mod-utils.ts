import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DimItem } from '../inventory/item-types';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './processWorker/mappers';
import { canTakeSlotIndependantMods, generateModPermutations } from './processWorker/processUtils';
import { ProcessItem } from './processWorker/types';
import {
  bucketsToCategories,
  knownModPlugCategoryHashes,
  LockableBucketHashes,
  LockedMod,
  LockedModMap,
  raidPlugCategoryHashes,
} from './types';

/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
export const doEnergiesMatch = (mod: LockedMod, item: DimItem) =>
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
  mods?: LockedMod[]
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
function assignSlotIndependantMods(
  setToMatch: ProcessItem[],
  lockedArmor2Mods: LockedModMap,
  assignments: Record<string, number[]>
): void {
  let generalMods: LockedMod[] = [];
  let otherMods: LockedMod[] = [];
  let raidMods: LockedMod[] = [];

  for (const [plugCategoryHashString, mods] of Object.entries(lockedArmor2Mods)) {
    const plugCategoryHash = Number(plugCategoryHashString);

    if (!mods) {
      continue;
    } else if (plugCategoryHash === armor2PlugCategoryHashesByName.general) {
      generalMods = mods;
    } else if (raidPlugCategoryHashes.includes(plugCategoryHash)) {
      raidMods = raidMods.concat(mods);
    } else if (!knownModPlugCategoryHashes.includes(plugCategoryHash)) {
      otherMods = otherMods.concat(mods);
    }
  }

  if (!generalMods || !otherMods || !raidMods) {
    return;
  }

  // Mods need to be sorted before being passed to the assignment function
  const generalProcessMods = generalMods.map(mapArmor2ModToProcessMod);
  const otherProcessMods = otherMods.map(mapArmor2ModToProcessMod);
  const raidProcessMods = raidMods.map(mapArmor2ModToProcessMod);

  const generalModPermutations = generateModPermutations(generalProcessMods);
  const otherModPermutations = generateModPermutations(otherProcessMods);
  const raidModPermutations = generateModPermutations(raidProcessMods);

  canTakeSlotIndependantMods(
    generalModPermutations,
    otherModPermutations,
    raidModPermutations,
    setToMatch,
    assignments
  );
}

export function assignModsToArmorSet(
  setToMatch: readonly DimItem[],
  lockedArmor2Mods: LockedModMap
): [Record<string, LockedMod[]>, LockedMod[]] {
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

  assignSlotIndependantMods(processItems, lockedArmor2Mods, assignments);

  const modsByHash = _.groupBy(
    Object.values(lockedArmor2Mods)
      .flat()
      .filter((x: LockedMod | undefined): x is LockedMod => Boolean(x)),
    (mod) => mod.modDef.hash
  );
  const assignedMods = _.mapValues(assignments, (modHashes) =>
    modHashes.map((modHash) => modsByHash[modHash].pop()).filter((x): x is LockedMod => Boolean(x))
  );
  const assigned = Object.values(assignedMods).flat();
  const unassignedMods = Object.values(lockedArmor2Mods)
    .flat()
    .filter((unassign): unassign is LockedMod =>
      Boolean(unassign && !assigned.some((assign) => assign.key === unassign.key))
    );

  return [assignedMods, unassignedMods];
}
