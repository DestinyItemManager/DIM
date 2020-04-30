import { DimItem } from './../../inventory/item-types';
import _ from 'lodash';
import { LockableBuckets, ArmorSet, LockedArmor2ModMap, LockedArmor2Mod } from './../types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { getSpecialtySocketMetadata, Armor2ModPlugCategories } from 'app/utils/item-utils';

const energyOrder = [
  DestinyEnergyType.Void,
  DestinyEnergyType.Thermal,
  DestinyEnergyType.Arc,
  DestinyEnergyType.Any
];

function addModSetAssignment(mod: LockedArmor2Mod, set: ArmorSet, assigned: DimItem) {
  const setKey = JSON.stringify(set.firstValidSet.map((item) => item.hash));
  if (!mod.setAssignments) {
    mod.setAssignments = new Map();
  }

  mod.setAssignments.set(setKey, assigned.hash);
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
            const setMods = [helmetMod, armsMod, chestMod, legsMod, classMod];
            const applicableMods = setMods.filter(Boolean);
            const containsAllLocked = seasonalMods.every((item) => applicableMods.includes(item));

            if (containsAllLocked) {
              for (let i = 0; i < setMods.length; i++) {
                if (setMods[i]) {
                  addModSetAssignment(setMods[i], set, set.firstValidSet[i]);
                }
              }
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
  const armour2Items = set.firstValidSet.filter((item) => item.isDestiny2() && item.energy);
  let armour2Count = armour2Items.length;

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

  let piecesLeft = [...set.firstValidSet];
  for (const energyType of energyOrder) {
    if (generalModsByEnergyType[energyType]) {
      for (let i = 0; i < generalModsByEnergyType[energyType].length; i++) {
        if (energyType !== DestinyEnergyType.Any) {
          const piece = armourByEnergyType[energyType][i];
          addModSetAssignment(generalModsByEnergyType[energyType][i], set, piece);
          piecesLeft = piecesLeft.filter((item) => item !== piece);
        } else {
          addModSetAssignment(generalModsByEnergyType[energyType][i], set, piecesLeft[0]);
          piecesLeft = piecesLeft.filter((item) => item !== piecesLeft[0]);
        }
      }
    }
  }

  return true;
}

export function canFirstValidSetTakeMods(set: ArmorSet, lockedArmor2Mods: LockedArmor2ModMap) {
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

  const energiesMatches = (item: DimItem, mods?: readonly LockedArmor2Mod[]): boolean =>
    Boolean(!mods?.length || mods.every((mod) => doEnergiesMatch(mod, item)));

  // ensure all the mods match their respective energy type in on the armour piece
  if (
    energiesMatches(set.firstValidSet[0], lockedArmor2Mods[Armor2ModPlugCategories.helmet]) && //helmets
    energiesMatches(set.firstValidSet[1], lockedArmor2Mods[Armor2ModPlugCategories.gauntlets]) && //arms
    energiesMatches(set.firstValidSet[2], lockedArmor2Mods[Armor2ModPlugCategories.chest]) && //chest
    energiesMatches(set.firstValidSet[3], lockedArmor2Mods[Armor2ModPlugCategories.leg]) && //legs
    energiesMatches(set.firstValidSet[4], lockedArmor2Mods[Armor2ModPlugCategories.classitem]) //classitem
  ) {
    lockedArmor2Mods[Armor2ModPlugCategories.helmet]?.forEach((mod) =>
      addModSetAssignment(mod, set, set.firstValidSet[0])
    );
    lockedArmor2Mods[Armor2ModPlugCategories.gauntlets]?.forEach((mod) =>
      addModSetAssignment(mod, set, set.firstValidSet[1])
    );
    lockedArmor2Mods[Armor2ModPlugCategories.chest]?.forEach((mod) =>
      addModSetAssignment(mod, set, set.firstValidSet[2])
    );
    lockedArmor2Mods[Armor2ModPlugCategories.leg]?.forEach((mod) =>
      addModSetAssignment(mod, set, set.firstValidSet[3])
    );
    lockedArmor2Mods[Armor2ModPlugCategories.classitem]?.forEach((mod) =>
      addModSetAssignment(mod, set, set.firstValidSet[4])
    );
  } else {
    return false;
  }

  return true;
}
