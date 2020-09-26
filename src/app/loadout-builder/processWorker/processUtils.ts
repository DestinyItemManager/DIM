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

const noModsPermutations = [[null, null, null, null, null]];

/**
 * This is heaps algorithm implemented for generating mod permutations.
 * https://en.wikipedia.org/wiki/Heap%27s_algorithm
 *
 * Note that we ensure the array length is always 5 so mods are aligned
 * with the 5 items.
 */
export function generateModPermutations(mods: ProcessMod[]): (ProcessMod | null)[][] {
  if (!mods.length) {
    return noModsPermutations;
  }
  const cursorArray = [0, 0, 0, 0, 0];
  const modsCopy: (ProcessMod | null)[] = Array.from(mods);

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

function getEnergyCounts(modsOrItems: (ProcessMod | null | ProcessItemSubset)[]) {
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

  const [arcItems, solarItems, voidItems] = getEnergyCounts(sortedItems);
  const [arcSeasonalMods, solarSeasonalMods, voidSeasonalMods] = getEnergyCounts(
    seasonalModPermutations[0]
  );
  const [arcGeneralMods, solarGeneralModsMods, voidGeneralMods] = getEnergyCounts(
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
    let seasonalsFit = true;
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i];
      const seasonTag = seasonalP[i]?.tag;
      const seasonalEnergy = seasonalP[i]?.energy || defaultModEnergy;
      seasonalsFit &&= Boolean(
        item.energy &&
          item.energy.val + (seasonalEnergy.val || 0) <= MAX_ARMOR_ENERGY_CAPACITY &&
          (item.energy.type === seasonalEnergy.type ||
            seasonalEnergy.type === DestinyEnergyType.Any) &&
          (!seasonalP[i] || (seasonTag && item.compatibleModSeasons?.includes(seasonTag)))
      );

      if (!seasonalsFit) {
        break;
      }
    }
    if (!seasonalsFit) {
      continue;
    }
    for (const generalP of generalModPermutations) {
      let generalsFit = true;
      for (let i = 0; i < sortedItems.length; i++) {
        const item = sortedItems[i];
        const generalEnergy = generalP[i]?.energy || defaultModEnergy;
        const seasonalEnergy = seasonalP[i]?.energy || defaultModEnergy;
        generalsFit &&= Boolean(
          item.energy &&
            item.energy.val + generalEnergy.val + seasonalEnergy.val <= MAX_ARMOR_ENERGY_CAPACITY &&
            (item.energy.type === generalEnergy.type ||
              generalEnergy.type === DestinyEnergyType.Any)
        );

        if (!generalsFit) {
          break;
        }
      }
      if (generalsFit) {
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
