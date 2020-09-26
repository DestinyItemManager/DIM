import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { MAX_ARMOR_ENERGY_CAPACITY } from '../../search/d2-known-values';
import { ProcessMod } from './types';

interface SortParam {
  energy: {
    type: DestinyEnergyType;
    val: number;
  } | null;
  season?: number;
}

export interface ProcessItemSubset extends SortParam {
  id: string;
  compatibleModSeasons?: string[];
}

/**
 * This sorting function is pivitol in the algorithm to figure out it seasonal mods can be slotted into
 * a list of items. It sorts by season and then energyType in descending order. Both mods and items
 * should be sorted by this algorithms.
 */
export function sortForSeasonalProcessMods(a: SortParam, b: SortParam) {
  if (a.season && b.season) {
    if (a.season === b.season) {
      if (a.energy && b.energy) {
        if (a.energy.type === b.energy.type) {
          return b.energy.val - a.energy.val;
        } else {
          return b.energy.type - a.energy.type;
        }
      }
    } else {
      return b.season - a.season;
    }
    // I don't think the following cases will every happen but I have included them just incase.
  } else if (a.season === undefined) {
    return 1;
  }
  return -1;
}

/**
 * This sorting function is pivitol in the algorithm to figure out it general mods can be slotted into
 * a list of items. It sorts by energyType in descending order. Both mods and items should be sorted
 * by this algorithms.
 */
export function sortForGeneralProcessMods(a: SortParam, b: SortParam) {
  // any energy is 0 so check undefined rather than falsey
  if (a.energy && b.energy) {
    if (a.energy.type === b.energy.type) {
      return b.energy.val - a.energy.val;
    } else {
      return b.energy.type - a.energy.type;
    }
  } else if (!a.energy) {
    return 1;
  }

  return -1;
}

/**
 * See if we can slot all the locked seasonal mods.
 *
 * This function need to be kept inline with ../mod-utils#assignAllSeasonalMods.
 *
 * @param processedMods These mods must be sorted by sortProcessModsOrProcessItems.
 * @param items The process items to test for mod slotting.
 * @param assignments This is an optional object that tracks item ids to mod hashes so
 *  that mods can be displayed for items in the UI. If passed in it is mutated.
 */
export function canTakeAllSeasonalMods(
  processedMods: ProcessMod[],
  items: ProcessItemSubset[],
  assignments?: Record<string, number[]>
) {
  const sortedItems = Array.from(items).sort(sortForSeasonalProcessMods);

  let modIndex = 0;
  let itemIndex = 0;

  // Loop over the items and mods in parallel and see if they can be slotted.
  // due to Any energy mods needing to consider skipped items we reset item index after each splice.
  while (modIndex < processedMods.length && itemIndex < sortedItems.length) {
    const { energy, tag, hash } = processedMods[modIndex];
    const item = sortedItems[itemIndex];
    if (!tag) {
      // This should never happen but if it does we ignore seasonal requirements and log the warning.
      console.warn('Optimiser: Found seasonal mod without season details.');
      return true;
    }
    if (
      item.energy &&
      (item.energy.type === energy.type || energy.type === DestinyEnergyType.Any) &&
      item.energy.val + energy.val <= MAX_ARMOR_ENERGY_CAPACITY &&
      item.compatibleModSeasons?.includes(tag)
    ) {
      if (assignments) {
        assignments[item.id].push(hash);
      }
      sortedItems.splice(itemIndex, 1);
      modIndex += 1;
      itemIndex = 0;
    } else {
      itemIndex += 1;
    }
  }

  // This will indicate we have iterated over all the mods, it will overshoot the length on success.
  return processedMods.length === modIndex;
}

/**
 * See if we can slot all the locked general mods.
 *
 * This function need to be kept inline with ../mod-utils#assignAllGeneralMods.
 *
 * @param processedMods These mods must be sorted by sortGeneralModsOrProcessItem.
 * @param items The process items to test for mod slotting.
 * @param assignments This is an optional object that tracks item ids to mod hashes so
 *  that mods can be displayed for items in the UI. If passed in it is mutated.
 */
export function canTakeAllGeneralMods(
  processedMods: ProcessMod[],
  items: ProcessItemSubset[],
  assignments?: Record<string, number[]>
) {
  const sortedItems = Array.from(items).sort(sortForGeneralProcessMods);

  let modIndex = 0;
  let itemIndex = 0;

  // Loop over the items and mods in parallel and see if they can be slotted.
  // We need to reset the index after a match to ensure that mods with the Any energy type
  // use up armour items that didn't match an energy type/season first.
  while (modIndex < processedMods.length && itemIndex < sortedItems.length) {
    const { energy, hash } = processedMods[modIndex];
    const item = sortedItems[itemIndex];
    if (
      item.energy &&
      (item.energy.type === energy.type || energy.type === DestinyEnergyType.Any) &&
      item.energy.val + energy.val <= MAX_ARMOR_ENERGY_CAPACITY
    ) {
      if (assignments) {
        assignments[item.id].push(hash);
      }
      sortedItems.splice(itemIndex, 1);
      modIndex += 1;
      itemIndex = 0;
    } else {
      itemIndex += 1;
    }
  }

  // This will indicate we have iterated over all the mods, it will overshoot the length on success.
  return processedMods.length === modIndex;
}

/**
 * This is heaps algorithm implemented for generating mod permutations.
 * https://en.wikipedia.org/wiki/Heap%27s_algorithm
 *
 * Note that we ensure the array length is always 5 so mods are aligned
 * with the 5 items.
 */
export function generateModPermutations(mods: ProcessMod[]): (ProcessMod | null)[][] {
  const cursorArray = [0, 0, 0, 0, 0];
  const modsCopy: (ProcessMod | null)[] = [...mods];

  while (modsCopy.length < 5) {
    modsCopy.push(null);
  }

  let i = 0;

  const rtn = [Array.from(modsCopy)];

  while (i < 5) {
    if (cursorArray[i] < i) {
      if (i % 2 === 0) {
        [modsCopy[0], modsCopy[i]] = [modsCopy[i], modsCopy[0]];
      } else {
        [modsCopy[cursorArray[i]], modsCopy[i]] = [modsCopy[i], modsCopy[cursorArray[i]]];
      }
      rtn.push(Array.from(modsCopy));
      cursorArray[i] += 1;
      i = 0;
    } else {
      cursorArray[i] = 0;
      i += 1;
    }
  }

  const stringifyPerm = (perm: (ProcessMod | null)[]) => {
    let permString = '';
    for (const modOrNull of perm) {
      if (modOrNull) {
        permString += `(${modOrNull.energy.type},${modOrNull.energy.val},${modOrNull.tag || ''})`;
      }
      permString += ',';
    }
    return permString;
  };

  return _.uniqBy(rtn, stringifyPerm);
}

function getEnergyCosts(modsOrItems: (ProcessMod | null | ProcessItemSubset)[]) {
  let arcCount = 0;
  let solarCount = 0;
  let voidCount = 0;

  for (const item of modsOrItems) {
    switch (item?.energy?.type) {
      case DestinyEnergyType.Arc:
        arcCount += 1;
        break;
      case DestinyEnergyType.Thermal:
        solarCount += 1;
        break;
      case DestinyEnergyType.Void:
        voidCount += 1;
        break;
    }
  }

  return [arcCount, solarCount, voidCount];
}

/**
 * This figures out if all general and seasonal mods can be assigned to an armour set.
 *
 * The params generalModPermutations and seasonalModPermutations are assumed to be the results
 * from processUtils.ts#generateModPermutations, i.e. all permutations of seasonal or general mods.
 *
 * assignments is mutated by this function to store any mods assignments that were made.
 */
export function canTakeGeneralAndSeasonalMods(
  generalModPermutations: (ProcessMod | null)[][],
  seasonalModPermutations: (ProcessMod | null)[][],
  items: ProcessItemSubset[],
  assignments?: Record<string, number[]>
) {
  // Sort the items like the mods are to try and get a greedy result
  const sortedItems = Array.from(items).sort(sortForGeneralProcessMods);

  const [arcItems, solarItems, voidItems] = getEnergyCosts(sortedItems);
  const [arcSeasonalMods, solarSeasonalMods, voidSeasonalMods] = getEnergyCosts(
    seasonalModPermutations[0]
  );
  const [arcGeneralMods, solarGeneralModsMods, voidGeneralMods] = getEnergyCosts(
    generalModPermutations[0]
  );

  if (
    voidItems < voidGeneralMods ||
    voidItems < voidSeasonalMods ||
    solarItems < solarGeneralModsMods ||
    solarItems < solarSeasonalMods ||
    arcItems < arcGeneralMods ||
    arcItems < arcSeasonalMods
  ) {
    return false;
  }

  const defaultModEnergy = { val: 0, type: DestinyEnergyType.Any };

  for (const seasonalP of seasonalModPermutations) {
    if (
      !sortedItems.every((item, itemIndex) => {
        const seasonTag = seasonalP[itemIndex]?.tag;
        const seasonalEnergy = seasonalP[itemIndex]?.energy || defaultModEnergy;
        return (
          item.energy &&
          item.energy.val + (seasonalEnergy.val || 0) <= MAX_ARMOR_ENERGY_CAPACITY &&
          (item.energy.type === seasonalEnergy.type ||
            seasonalEnergy.type === DestinyEnergyType.Any) &&
          (!seasonalP[itemIndex] || (seasonTag && item.compatibleModSeasons?.includes(seasonTag)))
        );
      })
    ) {
      continue;
    }
    for (const generalP of generalModPermutations) {
      if (
        sortedItems.every((item, itemIndex) => {
          const generalEnergy = generalP[itemIndex]?.energy || defaultModEnergy;
          const seasonalEnergy = seasonalP[itemIndex]?.energy || defaultModEnergy;
          return (
            item.energy &&
            item.energy.val + generalEnergy.val + seasonalEnergy.val <= MAX_ARMOR_ENERGY_CAPACITY &&
            (item.energy.type === generalEnergy.type ||
              generalEnergy.type === DestinyEnergyType.Any)
          );
        })
      ) {
        if (assignments) {
          for (let i = 0; i < sortedItems.length; i++) {
            const generalMod = generalP[i];
            const seasonalMod = seasonalP[i];
            if (generalMod) {
              assignments[sortedItems[i].id].push(generalMod.hash);
            }
            if (seasonalMod) {
              assignments[sortedItems[i].id].push(seasonalMod.hash);
            }
          }
        }

        return true;
      }
    }
  }

  return false;
}
