import { DimItem } from './../../inventory/item-types';
import _ from 'lodash';
import { LockableBuckets, LockedArmor2ModMap, LockedArmor2Mod } from './../types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { getSpecialtySocketMetadata, Armor2ModPlugCategories } from 'app/utils/item-utils';

const energyOrder = [
  DestinyEnergyType.Void,
  DestinyEnergyType.Thermal,
  DestinyEnergyType.Arc,
  DestinyEnergyType.Any,
];

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
 * assignments is mutated in this function as it tracks assigned mods for a particular armour set
 */
function assignGeneralMods(
  setToMatch: readonly DimItem[],
  generalMods: LockedArmor2Mod[],
  assignments: Record<number, LockedArmor2Mod[]>
): void {
  const armour2Items = setToMatch.filter((item) => item.isDestiny2() && item.energy);
  if (generalMods && armour2Items.length < generalMods.length) {
    return;
  }

  const generalModsByEnergyType = _.groupBy(
    generalMods,
    (mod) => mod.mod.plug.energyCost.energyType
  );

  const armourByEnergyType = _.groupBy(
    setToMatch,
    (item) => item.isDestiny2() && item.energy?.energyType
  );

  let piecesLeft = [...setToMatch];
  for (const energyType of energyOrder) {
    if (generalModsByEnergyType[energyType]) {
      for (let i = 0; i < generalModsByEnergyType[energyType].length; i++) {
        const mod = generalModsByEnergyType[energyType][i];
        if (
          energyType !== DestinyEnergyType.Any &&
          armourByEnergyType[energyType] &&
          i < armourByEnergyType[energyType].length
        ) {
          const piece = armourByEnergyType[energyType][i];
          assignments[piece.hash].push(mod);
          piecesLeft = piecesLeft.filter((item) => item !== piece);
        } else if (energyType === DestinyEnergyType.Any && piecesLeft.length) {
          assignments[piecesLeft[0].hash].push(mod);
          piecesLeft.shift();
        }
      }
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
 */
function assignAllSeasonalMods(
  setToMatch: readonly DimItem[],
  seasonalMods: readonly LockedArmor2Mod[],
  assignments: Record<number, LockedArmor2Mod[]>
): void {
  const firstValidSetArmor2Count = setToMatch.reduce(
    (total, item) => (item.isDestiny2() && item.energy ? total + 1 : total),
    0
  );

  if (!seasonalMods || seasonalMods.length > 5 || seasonalMods.length > firstValidSetArmor2Count) {
    return;
  }

  const modsByArmorBucket = {};

  // Build up an array of possible mods for each item in the set.
  for (const mod of seasonalMods) {
    for (const item of setToMatch) {
      const itemModCategories =
        getSpecialtySocketMetadata(item)?.compatiblePlugCategoryHashes || [];

      if (itemModCategories.includes(mod.mod.plug.plugCategoryHash) && doEnergiesMatch(mod, item)) {
        if (!modsByArmorBucket[item.bucket.hash]) {
          modsByArmorBucket[item.bucket.hash] = [];
        }

        modsByArmorBucket[item.bucket.hash].push(mod);
      }
    }
  }

  // From the possible mods try and find a combination that includes all seasonal mods
  for (const helmetMod of modsByArmorBucket[LockableBuckets.helmet] || [null]) {
    for (const armsMod of modsByArmorBucket[LockableBuckets.gauntlets] || [null]) {
      for (const chestMod of modsByArmorBucket[LockableBuckets.chest] || [null]) {
        for (const legsMod of modsByArmorBucket[LockableBuckets.leg] || [null]) {
          for (const classMod of modsByArmorBucket[LockableBuckets.classitem] || [null]) {
            const setMods = [helmetMod, armsMod, chestMod, legsMod, classMod];
            const applicableMods = setMods.filter(Boolean);
            const containsAllLocked =
              seasonalMods.every((item) => applicableMods.includes(item)) &&
              _.uniq(applicableMods).length === applicableMods.length;

            if (containsAllLocked) {
              for (let i = 0; i < setMods.length; i++) {
                if (setMods[i]) {
                  assignModsForSlot(setToMatch[i], [setMods[i]], assignments);
                }
              }
              return;
            }
          }
        }
      }
    }
  }
}

export function assignModsToArmorSet(
  setToMatch: readonly DimItem[],
  lockedArmor2Mods: LockedArmor2ModMap
): Record<number, LockedArmor2Mod[]> {
  const assignments: Record<number, LockedArmor2Mod[]> = {};

  for (const item of setToMatch) {
    assignments[item.hash] = new Array<LockedArmor2Mod>();
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

// Should be in the same order as first valid set
export function canSetTakeMods(set: readonly DimItem[], lockedArmor2Mods: LockedArmor2ModMap) {
  const modAssignments = assignModsToArmorSet(set, lockedArmor2Mods);

  let assignmentCount = 0;
  for (const slotAssignments of Object.values(modAssignments)) {
    assignmentCount += slotAssignments.length;
  }

  let modCount = 0;
  for (const slotMods of Object.values(lockedArmor2Mods)) {
    modCount += slotMods.length;
  }

  return assignmentCount === modCount;
}
