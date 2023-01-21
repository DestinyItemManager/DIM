import { generatePermutationsOfFive } from 'app/loadout/mod-permutations';
import { ArmorStatHashes } from '../types';
import { buildCacheV2, CacheV2, ModsPickV2 } from './auto-stat-mod-utils';
import { ModAssignmentStatistics, ProcessItem, ProcessMod } from './types';

export interface PrecalculatedInfo {
  cache: CacheV2;
  statOrder: ArmorStatHashes[];
  hasActivityMods: boolean;
  generalModCosts: number[];
  activityModPermutations: (ProcessMod | null)[][];
  activityTagCounts: { [tag: string]: number };
}

export function precalculateStructures(
  generalMods: ProcessMod[],
  activityMods: ProcessMod[],
  autoStatMods: boolean,
  statOrder: ArmorStatHashes[]
): PrecalculatedInfo {
  return {
    cache: buildCacheV2(autoStatMods),
    statOrder,
    hasActivityMods: activityMods.length > 0,
    generalModCosts: generalMods.map((m) => m.energy?.val || 0),
    activityModPermutations: generateProcessModPermutations(activityMods),
    activityTagCounts: activityMods.reduce((acc, mod) => {
      if (mod.tag) {
        acc[mod.tag] = (acc[mod.tag] || 0) + 1;
      }
      return acc;
    }, {}),
  };
}

/**
 * This figures out if all general, combat and activity mods can be assigned to an armour set and auto stat mods
 * can be picked to provide the neededStats.
 *
 * The params combatModPermutations, activityModPermutations are assumed to be the results
 * from processUtils.ts#generateModPermutations, i.e. all permutations of combat or activity mods.
 * By preprocessing all the assignments we skip a lot of work in the middle of the big process algorithm.
 *
 * Returns a ModsPick representing the automatically picked stat mods in the success case, even
 * if no auto stat mods were requested/needed, in which case the arrays will be empty.
 */
export function pickAndAssignSlotIndependentMods(
  info: PrecalculatedInfo,
  modStatistics: ModAssignmentStatistics,
  items: ProcessItem[],
  neededStats: number[] | undefined
): ModsPickV2[] | undefined {
  modStatistics.earlyModsCheck.timesChecked++;

  // An early check to ensure we have enough activity mod combos
  // It works by creating an index of tags to totals of said tag
  // we can then ensure we have enough items with said tags.
  if (info.hasActivityMods) {
    for (const tag of Object.keys(info.activityTagCounts)) {
      let socketsCount = 0;
      for (const item of items) {
        if (item.compatibleModSeasons?.includes(tag)) {
          socketsCount++;
        }
      }
      if (socketsCount < info.activityTagCounts[tag]) {
        modStatistics.earlyModsCheck.timesFailed++;
        return undefined;
      }
    }
  }

  let assignedModsAtLeastOnce = false;
  const remainingEnergyCapacities = [0, 0, 0, 0, 0];

  modStatistics.finalAssignment.modAssignmentAttempted++;

  // Now we begin looping over all the mod permutations.
  activityModLoop: for (const activityPermutation of info.activityModPermutations) {
    activityItemLoop: for (let i = 0; i < items.length; i++) {
      const activityMod = activityPermutation[i];

      // If a mod is null there is nothing being socketed into the item so move on
      if (!activityMod) {
        continue activityItemLoop;
      }

      const item = items[i];
      const tag = activityMod.tag!;

      // The activity mods wont fit in the item set so move on to the next set of mods
      if (!item.compatibleModSeasons?.includes(tag)) {
        continue activityModLoop;
      }
    }

    assignedModsAtLeastOnce = true;

    // This is a valid activity and combat mod assignment. See how much energy is left over per piece
    // eslint-disable-next-line github/array-foreach
    items.forEach(
      (i, idx) =>
        (remainingEnergyCapacities[idx] =
          (i.energy?.capacity || 0) -
          (i.energy?.val || 0) -
          (activityPermutation[idx]?.energy?.val || 0))
    );

    // Sort the costs array descending, same as our auto stat mod picks
    remainingEnergyCapacities.sort((a, b) => b - a);

    if (neededStats) {
      const result = recursivelyChooseMods(
        info,
        neededStats,
        0,
        5 - info.generalModCosts.length,
        items.filter((i) => i.isArtifice).length,
        remainingEnergyCapacities,
        []
      );

      if (result) {
        return result;
      }
    } else {
      if (info.generalModCosts.every((cost, index) => cost <= remainingEnergyCapacities[index])) {
        return [];
      }
    }
  }

  if (assignedModsAtLeastOnce && neededStats) {
    modStatistics.finalAssignment.autoModsAssignmentFailed++;
  } else {
    modStatistics.finalAssignment.modsAssignmentFailed++;
  }
  return undefined;
}

function recursivelyChooseMods(
  info: PrecalculatedInfo,
  neededStats: number[],
  statIndex: number,
  remainingGeneralSlots: number,
  remainingArtificeSlots: number,
  remainingEnergyCapacities: number[],
  pickedMods: ModsPickV2[]
): ModsPickV2[] | undefined {
  while (neededStats[statIndex] === 0) {
    if (++statIndex === info.statOrder.length) {
      // We've hit the end of our needed stats, check if this is possible
      const modCosts = [...info.generalModCosts, ...pickedMods.flatMap((m) => m.generalModsCosts)];
      modCosts.sort((a, b) => b - a);
      if (modCosts.every((cost, index) => cost <= remainingEnergyCapacities[index])) {
        return pickedMods;
      } else {
        return undefined;
      }
    }
  }

  const possiblePicks =
    info.cache.statCaches[info.statOrder[statIndex]].waysToGetThisStat[neededStats[statIndex]];
  if (!possiblePicks) {
    // we can't possibly hit our target stats
    return undefined;
  }

  const subArray = pickedMods.slice();
  subArray.push(subArray[0]);

  for (const pick of possiblePicks) {
    if (
      pick.numArtificeMods > remainingArtificeSlots ||
      pick.numGeneralMods > remainingGeneralSlots
    ) {
      continue;
    }
    subArray[subArray.length - 1] = pick;
    const solution = recursivelyChooseMods(
      info,
      neededStats,
      statIndex + 1,
      remainingGeneralSlots - pick.numGeneralMods,
      remainingArtificeSlots - pick.numArtificeMods,
      remainingEnergyCapacities,
      subArray
    );
    if (solution) {
      return solution;
    }
  }
}

export function generateProcessModPermutations(mods: (ProcessMod | null)[]) {
  // Creates a string from the mod permutation containing the unique properties
  // that we care about, so we can reduce to the minimum number of permutations.
  // If two different mods that fit in the same socket have the same cost,
  // they are identical from the mod assignment perspective.
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
