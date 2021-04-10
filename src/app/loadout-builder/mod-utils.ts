import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import {
  canTakeSlotIndependantMods,
  generateModPermutations,
} from './process-worker/process-utils';
import { ProcessItem } from './process-worker/types';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './process/mappers';
import {
  bucketsToCategories,
  knownModPlugCategoryHashes,
  LockableBucketHashes,
  raidPlugCategoryHashes,
} from './types';

/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
export const doEnergiesMatch = (mod: PluggableInventoryItemDefinition, item: DimItem) =>
  item.energy &&
  (!mod.plug.energyCost ||
    mod.plug.energyCost.energyType === DestinyEnergyType.Any ||
    mod.plug.energyCost.energyType === item.energy?.energyType);

/**
 * If the energies match, this will assign the mods to the item in assignments.
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set
 */
function assignModsForSlot(
  item: DimItem,
  assignments: Record<string, number[]>,
  mods?: PluggableInventoryItemDefinition[]
): void {
  if (mods?.length && mods.every((mod) => doEnergiesMatch(mod, item))) {
    assignments[item.id] = [...assignments[item.id], ...mods.map((mod) => mod.hash)];
  }
}

/**
 * Checks to see if the passed in general and other mods can be assigned to the armour set.
 *
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set
 */
function assignSlotIndependantMods(
  setToMatch: ProcessItem[],
  lockedMods: PluggableInventoryItemDefinition[],
  assignments: Record<string, number[]>
): void {
  const generalMods: PluggableInventoryItemDefinition[] = [];
  const otherMods: PluggableInventoryItemDefinition[] = [];
  const raidMods: PluggableInventoryItemDefinition[] = [];

  for (const mod of lockedMods) {
    const { plugCategoryHash } = mod.plug;
    if (plugCategoryHash === armor2PlugCategoryHashesByName.general) {
      generalMods.push(mod);
    } else if (raidPlugCategoryHashes.includes(plugCategoryHash)) {
      raidMods.push(mod);
    } else if (!knownModPlugCategoryHashes.includes(plugCategoryHash)) {
      otherMods.push(mod);
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
  lockedMods: PluggableInventoryItemDefinition[]
): [Record<string, PluggableInventoryItemDefinition[]>, PluggableInventoryItemDefinition[]] {
  const assignments: Record<string, number[]> = {};

  for (const item of setToMatch) {
    assignments[item.id] = [];
  }

  const processItems: ProcessItem[] = [];
  const lockedModMap = _.groupBy(lockedMods, (mod) => mod.plug.plugCategoryHash);

  for (const hash of LockableBucketHashes) {
    const item = setToMatch.find((i) => i.bucket.hash === hash);

    if (item) {
      const lockedModsByPlugCategoryHash = lockedModMap[bucketsToCategories[hash]];
      assignModsForSlot(item, assignments, lockedModsByPlugCategoryHash);
      processItems.push(mapDimItemToProcessItem(item, lockedModsByPlugCategoryHash));
    }
  }

  assignSlotIndependantMods(processItems, lockedMods, assignments);

  const modsByHash = _.groupBy(lockedMods, (mod) => mod.hash);

  // In this we map modHashes to their mod using modsByHash. Note that we pop the mod from the
  // array in modByHash, this will leave us with any unassigned mods left in modsByHash
  const assignedMods = _.mapValues(assignments, (modHashes) =>
    modHashes
      .map((modHash) => modsByHash[modHash].pop())
      // This shouldn't happen but lets throw in a filter for saftey and type happyness
      .filter((x): x is PluggableInventoryItemDefinition => Boolean(x))
  );

  const unassignedMods = Object.values(modsByHash).flat();

  return [assignedMods, unassignedMods];
}

/**
 * Checks to see if some mod in a collection of LockedMod or LockedMod,
 * has an elemental (non-Any) energy requirement
 */
export function someModHasEnergyRequirement(mods: PluggableInventoryItemDefinition[]) {
  return mods.some(
    (mod) => !mod.plug.energyCost || mod.plug.energyCost.energyType !== DestinyEnergyType.Any
  );
}

/**
 * Sorts PluggableInventoryItemDefinition's by the following list of comparators.
 * 1. The known plug category hashes, see ./types#knownModPlugCategoryHashes for ordering
 * 2. itemTypeDisplayName, so that legacy and combat mods are ordered alphabetically by their category name
 * 3. energyType, so mods in each category go Any, Arc, Solar, Void
 * 4. by energy cost, so cheaper mods come before more expensive mods
 * 5. by mod name, so mods in the same category with the same energy type and cost are alphabetical
 */
export const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((mod) => {
    const knownIndex = knownModPlugCategoryHashes.indexOf(mod.plug.plugCategoryHash);
    return knownIndex === -1 ? knownModPlugCategoryHashes.length : knownIndex;
  }),
  compareBy((mod) => mod.itemTypeDisplayName),
  compareBy((mod) => mod.plug.energyCost?.energyType),
  compareBy((mod) => mod.plug.energyCost?.energyCost),
  compareBy((mod) => mod.displayProperties.name)
);

/** Sorts an array of PluggableInventoryItemDefinition[]'s by the order of hashes in
 * loadout-builder/types#knownModPlugCategoryHashes and then sorts those not found in there by name.
 *
 * This assumes that each PluggableInventoryItemDefinition in each PluggableInventoryItemDefinition[]
 * has the same plugCategoryHash as it pulls it from the first PluggableInventoryItemDefinition.
 */
export const sortModGroups = chainComparator(
  compareBy((mods: PluggableInventoryItemDefinition[]) => {
    // We sort by known knownModPlugCategoryHashes so that it general, helmet, ..., classitem, raid, others.
    const knownIndex = knownModPlugCategoryHashes.indexOf(mods[0].plug.plugCategoryHash);
    return knownIndex === -1 ? knownModPlugCategoryHashes.length : knownIndex;
  }),
  compareBy((mods: PluggableInventoryItemDefinition[]) => mods[0].itemTypeDisplayName)
);

/**
 * Generates a unique key for a mod when rendering. As mods can appear multiple times as
 * siblings we need to count them and append a number to its hash to make it unique.
 *
 * Note that counts is mutated and a new object should be passed in with each render.
 */
export const getModRenderKey = (
  mod: PluggableInventoryItemDefinition,
  /** A supplied object to store the counts in. This is mutated. */
  counts: Record<number, number>
) => {
  if (!counts[mod.hash]) {
    counts[mod.hash] = 0;
  }

  return `${mod.hash}-${counts[mod.hash]++}`;
};
