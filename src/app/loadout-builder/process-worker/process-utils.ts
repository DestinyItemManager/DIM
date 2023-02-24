import { generatePermutationsOfFive } from 'app/loadout/mod-permutations';
import { ArmorStatHashes } from '../types';
import {
  createGeneralModsCache,
  GeneralModsCache,
  getViableGeneralModPicks,
  ModsPick,
} from './auto-stat-mod-utils';
import { ModAssignmentStatistics, ProcessItem, ProcessMod } from './types';

interface SortParam {
  energy?: {
    val: number;
  };
}

export interface ProcessItemSubset extends SortParam {
  id: string;
  compatibleModSeasons?: string[];
}

export interface PrecalculatedInfo {
  cache: GeneralModsCache;
  hasActivityMods: boolean;
  activityModPermutations: (ProcessMod | null)[][];
  activityTagCounts: { [tag: string]: number };
}

/**
 * This sorts process mods and items in the same manner as we try for greedy results.
 */
function sortProcessModsOrItems(a: SortParam, b: SortParam) {
  if (a.energy && b.energy) {
    return b.energy.val - a.energy.val;
  } else if (!a.energy) {
    return 1;
  }

  return -1;
}

export function precalculateStructures(
  generalMods: ProcessMod[],
  activityMods: ProcessMod[],
  autoStatMods: boolean,
  statOrder: ArmorStatHashes[]
): PrecalculatedInfo {
  return {
    cache: createGeneralModsCache(generalMods, statOrder, autoStatMods),
    hasActivityMods: activityMods.length > 0,
    activityModPermutations: generateProcessModPermutations(
      activityMods.sort(sortProcessModsOrItems)
    ),
    activityTagCounts: activityMods.reduce((acc, mod) => {
      if (mod.tag) {
        acc[mod.tag] = (acc[mod.tag] || 0) + 1;
      }
      return acc;
    }, {}),
  };
}

// Used for null values
const defaultModEnergy = { val: 0 };

/**
 * This figures out if all general, combat and activity mods can be assigned to an armour set and auto stat mods
 * can be picked to provide the neededStats.
 *
 * The param activityModPermutations is assumed to be the results
 * from processUtils.ts#generateModPermutations, i.e. all permutations of activity mods.
 * By preprocessing all the assignments we skip a lot of work in the middle of the big process algorithm.
 *
 * Returns a ModsPick representing the automatically picked stat mods in the success case, even
 * if no auto stat mods were requested/needed, in which case the arrays will be empty.
 */
export function pickAndAssignSlotIndependentMods(
  { activityModPermutations, activityTagCounts, cache, hasActivityMods }: PrecalculatedInfo,
  modStatistics: ModAssignmentStatistics,
  items: ProcessItem[],
  neededStats: number[] | undefined
): ModsPick | undefined {
  // Sort the items like the mods are to try and get a greedy result
  // Theory here is that aligning energy types between items and mods and assigning the mods with the
  // highest cost to the items with the highest amount of energy available will find results faster
  const sortedItems = Array.from(items).sort(sortProcessModsOrItems);

  modStatistics.earlyModsCheck.timesChecked++;

  // An early check to ensure we have enough activity mod combos
  // It works by creating an index of tags to totals of said tag
  // we can then ensure we have enough items with said tags.
  if (hasActivityMods) {
    for (const tag of Object.keys(activityTagCounts)) {
      let socketsCount = 0;
      for (const item of items) {
        if (item.compatibleModSeasons?.includes(tag)) {
          socketsCount++;
        }
      }
      if (socketsCount < activityTagCounts[tag]) {
        modStatistics.earlyModsCheck.timesFailed++;
        return undefined;
      }
    }
  }

  // Figure out if there's any way for stat mods to provide the needed stats -- if hitting target stats is trivially
  // infeasible, just don't.
  let validGeneralModPicks: ModsPick[] | undefined;
  if (neededStats) {
    modStatistics.autoModsPick.timesChecked++;
    validGeneralModPicks = getViableGeneralModPicks(cache, neededStats);
    if (validGeneralModPicks.length === 0) {
      modStatistics.autoModsPick.timesFailed++;
      return undefined;
    }
  }

  let assignedModsAtLeastOnce = false;
  const remainingEnergyCapacities = [0, 0, 0, 0, 0];

  modStatistics.finalAssignment.modAssignmentAttempted++;

  // Now we begin looping over all the mod permutations, we have chosen activity mods because they
  // are the most selective. This is a similar principle to DB query theory where you want to run
  // the most selective part of your query first to narrow results down as early as possible. In
  // this case we can use it to skip large branches of the triple nested mod loop because not all
  // armour will have activity slots.
  activityModLoop: for (const activityPermutation of activityModPermutations) {
    activityItemLoop: for (let i = 0; i < sortedItems.length; i++) {
      const activityMod = activityPermutation[i];

      // If a mod is null there is nothing being socketed into the item so move on
      if (!activityMod) {
        continue activityItemLoop;
      }

      const item = sortedItems[i];
      const tag = activityMod.tag!;
      const activityEnergy = activityMod.energy || defaultModEnergy;

      // Energy is valid when the item has enough energy capacity and the items energy type
      // accommodates the mods energy. When we allow energy changes the item can have the Any
      // energy type
      const activityEnergyIsValid =
        item.energy && item.energy.val + activityEnergy.val <= item.energy.capacity;

      // The activity mods wont fit in the item set so move on to the next set of mods
      if (!activityEnergyIsValid || !item.compatibleModSeasons?.includes(tag)) {
        continue activityModLoop;
      }
    }

    assignedModsAtLeastOnce = true;

    // This is a valid activity and combat mod assignment. See how much energy is left over per piece
    // eslint-disable-next-line github/array-foreach
    sortedItems.forEach(
      (i, idx) =>
        (remainingEnergyCapacities[idx] =
          (i.energy?.capacity || 0) -
          (i.energy?.val || 0) -
          (activityPermutation[idx]?.energy?.val || 0))
    );

    // Sort the costs array descending, same as our auto stat mod picks
    remainingEnergyCapacities.sort((a, b) => b - a);

    let validPick: ModsPick | undefined;

    if (validGeneralModPicks) {
      validPick = validGeneralModPicks.find((pick) =>
        pick.costs.every((cost, idx) => cost <= remainingEnergyCapacities[idx])
      );
    } else {
      // We don't need any stats, so just verify we can assign the general mods
      validPick = cache.generalModCosts.every((cost, idx) => cost <= remainingEnergyCapacities[idx])
        ? { costs: cache.generalModCosts, modHashes: [] }
        : undefined;
    }

    if (validPick) {
      return validPick;
    }
  }

  if (assignedModsAtLeastOnce && neededStats) {
    modStatistics.finalAssignment.autoModsAssignmentFailed++;
  } else {
    modStatistics.finalAssignment.modsAssignmentFailed++;
  }
  return undefined;
}

export function generateProcessModPermutations(mods: (ProcessMod | null)[]) {
  // Creates a string from the mod permutation containing the unique properties
  // that we care about, so we can reduce to the minimum number of permutations.
  // If two different mods that fit in the same socket have the same energy type
  // and cost, they are identical from the mod assignment perspective.
  // This works because we check to see if we have already recorded this string
  // in heaps algorithm before we add the permutation to the result.
  const createPermutationKey = (permutation: (ProcessMod | null)[]) =>
    permutation
      .map((mod) => {
        if (mod) {
          const energyCost = mod.energy?.val || 0;
          return `${energyCost}${mod.tag}`;
        }
      })
      .join(',');
  return generatePermutationsOfFive(mods, createPermutationKey);
}
