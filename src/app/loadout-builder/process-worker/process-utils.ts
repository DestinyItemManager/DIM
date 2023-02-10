import { generatePermutationsOfFive } from 'app/loadout/mod-permutations';
import { ArmorStatHashes, MinMaxIgnored } from '../types';
import { AutoModsMap, buildCacheV2, chooseAutoMods, ModsPick } from './auto-stat-mod-utils';
import { ModAssignmentStatistics, ProcessItem, ProcessMod } from './types';

export interface PrecalculatedInfo {
  cache: AutoModsMap;
  statOrder: ArmorStatHashes[];
  hasActivityMods: boolean;
  generalModCosts: number[];
  activityModPermutations: (ProcessMod | null)[][];
  activityTagCounts: { [tag: string]: number };
}

export function precalculateStructures(
  generalMods: ProcessMod[],
  activityMods: ProcessMod[],
  numAutoStatMods: number,
  statOrder: ArmorStatHashes[]
): PrecalculatedInfo {
  return {
    cache: buildCacheV2(numAutoStatMods),
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
 * The param activityModPermutations is assumed to be the result
 * from processUtils.ts#generateModPermutations, i.e. all permutations of activity mods.
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
): ModsPick[] | undefined {
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
      const energyCost = activityMod.energy?.val || 0;
      const itemEnergy = (item.energy && item.energy.capacity - item.energy.val) || 0;
      if (energyCost >= itemEnergy) {
        continue;
      }

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
      const result = chooseAutoMods(info, neededStats, items.filter((i) => i.isArtifice).length, [
        remainingEnergyCapacities,
      ]);

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

/*
 * Algorithm: Search tree of stat bumps. All left = highest prioritized stat is bumped as much as possible, all right = lowest prioritized stat.
 * Invariant: stat bump node does not have children bumping a lower-index stat (to avoid duplication).
 * Then exhaustively search this tree.
 * Easy prunes when optimal (partial) solution already found. Solution is optimal if
 * ALL OF:
 * * it does not use the same +5 mod or the same artifice mod twice
 * * it doesn't use a +5 and an artifice for the same stat?
 * * all artifice slots are filled
 * * EITHER:
 *   * all free mod slots and artifice slots are filled
 *   * all mod energy is spent and all artifice slots are filled
 */

/**
 * Optimizes the auto stat mod picks to maximize the prioritized stats.
 */
export function pickOptimalStatMods(
  info: PrecalculatedInfo,
  items: ProcessItem[],
  setStats: number[],
  statFiltersInStatOrder: MinMaxIgnored[]
): number[] | undefined {
  const remainingEnergiesPerAssignment: number[][] = [];

  // This loop is copy-pasted from above because we need to do the same thing as above
  // We don't have to do any of the early exits though, since we know they succeed.
  activityModLoop: for (const activityPermutation of info.activityModPermutations) {
    activityItemLoop: for (let i = 0; i < items.length; i++) {
      const activityMod = activityPermutation[i];
      if (!activityMod) {
        continue activityItemLoop;
      }

      const item = items[i];
      const tag = activityMod.tag!;
      const energyCost = activityMod.energy?.val || 0;
      const itemEnergy = (item.energy && item.energy.capacity - item.energy.val) || 0;
      if (energyCost >= itemEnergy) {
        continue;
      }

      if (!item.compatibleModSeasons?.includes(tag)) {
        continue activityModLoop;
      }
    }

    const remainingEnergyCapacities = items.map(
      (i, idx) =>
        (i.energy?.capacity || 0) -
        (i.energy?.val || 0) -
        (activityPermutation[idx]?.energy?.val || 0)
    );

    // Sort the costs array descending, same as our auto stat mod picks
    remainingEnergyCapacities.sort((a, b) => b - a);
    remainingEnergiesPerAssignment.push(remainingEnergyCapacities);
  }
  // The amount of additional stat points after which stats don't give us a benefit anymore.
  const maxAddedStats = [0, 0, 0, 0, 0, 0];
  const explorationStats = [0, 0, 0, 0, 0, 0];

  for (let statIndex = setStats.length - 1; statIndex >= 0; statIndex--) {
    const value = Math.min(Math.max(setStats[statIndex], 0), 100);
    const filter = statFiltersInStatOrder[statIndex];
    if (!filter.ignored) {
      const neededValue = filter.min * 10 - value;
      if (neededValue > 0) {
        // As per function preconditions, we know that we can hit these minimum stats
        explorationStats[statIndex] = neededValue;
      }
      maxAddedStats[statIndex] = filter.max * 10 - value;
    }
  }

  const numArtificeMods = items.filter((i) => i.isArtifice).length;

  const bestBoosts = exploreSearchTree(
    info,
    setStats,
    explorationStats,
    maxAddedStats,
    numArtificeMods,
    remainingEnergiesPerAssignment,
    0
  );

  return bestBoosts?.picks.flatMap((pick) => pick.modHashes);
}

interface SearchResult {
  picks: ModsPick[];
  numTierBoosts: number;
}

function exploreSearchTree(
  info: PrecalculatedInfo,
  /** The base stats from our set + fragments + ... */
  setStats: number[],
  /** The stats we have explored in this search tree */
  explorationStats: number[],
  /** The highest allowed stat values */
  maxAddedStats: number[],
  /** How many artifice mods this set has */
  numArtificeMods: number,
  /** The different permutations of leftover energy after assigning activity mods permutations */
  remainingEnergyCapacities: number[][],
  /** The stat index this branch of the search tree starts at */
  statIndex: number
): SearchResult | undefined {
  let bestResult: SearchResult | undefined = undefined;
  while (statIndex < setStats.length) {
    if (explorationStats[statIndex] >= maxAddedStats[statIndex]) {
      continue;
    }

    const subTreeStats = explorationStats.slice();
    if (explorationStats[statIndex] === 0) {
      subTreeStats[statIndex] = 10 - (setStats[statIndex] % 10);
    } else {
      subTreeStats[statIndex] += 10;
    }
    const picks = chooseAutoMods(info, subTreeStats, numArtificeMods, remainingEnergyCapacities);
    if (picks) {
      const subTreeResult = exploreSearchTree(
        info,
        setStats,
        subTreeStats,
        maxAddedStats,
        numArtificeMods,
        remainingEnergyCapacities,
        statIndex
      ) ?? {
        picks: picks,
        numTierBoosts: 1,
      };
      if (!bestResult || bestResult.numTierBoosts < subTreeResult.numTierBoosts) {
        bestResult = subTreeResult;
      }
    }
  }

  return bestResult;
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
