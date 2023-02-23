import { StatHashes } from 'app/../data/d2/generated-enums';
import { generatePermutationsOfFive } from 'app/loadout/mod-permutations';
import _ from 'lodash';
import { ArmorStatHashes, MinMaxIgnored } from '../types';
import { AutoModsMap, buildAutoModsMap, chooseAutoMods, ModsPick } from './auto-stat-mod-utils';
import { ModAssignmentStatistics, ProcessItem, ProcessMod } from './types';

/**
 * Data that stays the same in a given LO run.
 */
export interface LoSessionInfo {
  cache: AutoModsMap;
  statOrder: ArmorStatHashes[];
  hasActivityMods: boolean;
  /** The total cost of all user-picked general and activity mods. */
  totalModEnergyCost: number;
  /** The cost of user-picked general mods, sorted descending. */
  generalModCosts: number[];
  /** How many general mod slots are available for auto stat mods. */
  numAvailableGeneralMods: number;
  /** How many general mod slots have a remaining energy capacity of 2 or lower, so that only small mods can fit. */
  numConstrainedSlots: number;
  /** All uniquely distinguishable activity mod permutations */
  activityModPermutations: (ProcessMod | null)[][];
  /** How many activity mods we have per tag. */
  activityTagCounts: { [tag: string]: number };
}

export function precalculateStructures(
  generalMods: ProcessMod[],
  activityMods: ProcessMod[],
  autoStatMods: boolean,
  statOrder: ArmorStatHashes[],
  remainingEnergyMaxima: number[]
): LoSessionInfo {
  const generalModCosts = generalMods.map((m) => m.energy?.val || 0).sort((a, b) => b - a);
  let numConstrainedSlots: number, numAvailableGeneralMods: number;
  if (autoStatMods) {
    // How many slots could fit a small mod but not a large mod?
    const numZeroEnergyPieces = remainingEnergyMaxima.filter((e) => e === 0).length;
    const numPiecesForSmallMods = remainingEnergyMaxima.filter((e) => e >= 1 && e <= 2).length;
    numAvailableGeneralMods = 5 - numZeroEnergyPieces - generalModCosts.length;
    numConstrainedSlots = Math.min(numPiecesForSmallMods, numAvailableGeneralMods);
  } else {
    numConstrainedSlots = 0;
    numAvailableGeneralMods = 0;
  }

  return {
    cache: buildAutoModsMap(numAvailableGeneralMods),
    statOrder,
    hasActivityMods: activityMods.length > 0,
    generalModCosts,
    numAvailableGeneralMods,
    numConstrainedSlots,
    totalModEnergyCost:
      _.sum(generalModCosts) + _.sumBy(activityMods, (act) => act.energy?.val ?? 0),
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
  info: LoSessionInfo,
  modStatistics: ModAssignmentStatistics,
  items: ProcessItem[],
  neededStats: number[] | undefined
): ModsPick[] | undefined {
  modStatistics.earlyModsCheck.timesChecked++;

  let setEnergy = 0;
  for (const item of items) {
    if (item.energy) {
      setEnergy += item.energy.capacity - item.energy.val;
    }
  }

  if (setEnergy < info.totalModEnergyCost) {
    modStatistics.earlyModsCheck.timesFailed++;
    return undefined;
  }

  // An early check to ensure we have enough activity mod combos
  // It works by creating an index of tags to totals of said tag
  // we can then ensure we have enough items with said tags.
  if (info.hasActivityMods) {
    for (const [tag, tagCount] of Object.entries(info.activityTagCounts)) {
      let socketsCount = 0;
      for (const item of items) {
        if (item.compatibleModSeasons?.includes(tag)) {
          socketsCount++;
        }
      }
      if (socketsCount < tagCount) {
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
      (item, idx) =>
        (remainingEnergyCapacities[idx] =
          (item.energy?.capacity || 0) -
          (item.energy?.val || 0) -
          (activityPermutation[idx]?.energy?.val || 0))
    );
    remainingEnergyCapacities.sort((a, b) => b - a);

    if (neededStats) {
      const result = chooseAutoMods(
        info,
        items,
        neededStats,
        items.filter((i) => i.isArtifice).length,
        [remainingEnergyCapacities],
        setEnergy
      );

      if (result) {
        return result;
      }
    } else {
      remainingEnergyCapacities.sort((a, b) => b - a);
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

/**
 * Optimizes the auto stat mod picks to maximize total tier, prioritizing stats earlier in the stat order.
 */
export function pickOptimalStatMods(
  info: LoSessionInfo,
  items: ProcessItem[],
  setStats: number[],
  statFiltersInStatOrder: MinMaxIgnored[]
): { mods: number[]; numPoints: number } | undefined {
  const remainingEnergiesPerAssignment: number[][] = [];

  let setEnergy = 0;
  for (const item of items) {
    if (item.energy) {
      setEnergy += item.energy.capacity - item.energy.val;
    }
  }

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
  const bestBoosts = exploreAutoModsSearchTree(
    info,
    items,
    setStats,
    explorationStats,
    maxAddedStats,
    numArtificeMods,
    remainingEnergiesPerAssignment,
    setEnergy,
    0,
    0
  );

  return (
    bestBoosts && {
      mods: bestBoosts.picks.flatMap((pick) => pick.modHashes),
      numPoints: bestBoosts.depth,
    }
  );
}

interface SearchResult {
  picks: ModsPick[];
  depth: number;
}

/**
 * An exhaustive search over all possible stat boosts achievable by mods,
 * finding the best pick of mods when ordering by total tier > first stat > second stat > ...
 *
 * This essentially performs a backtracking search over a search tree.
 * Let's see what the tree looks like when considering two stats where our set has stats [86, 71]:
 *
 * T0  T1  T2  T3  T4 ...
 * |   |   |   |   |
 * [0, 0]
 * ├── [4, 0]
 * │   ├── [14, 0]
 * │   │   ├── [24, 0]
 * │   |   |   ├── [34, 0]
 * │   |   |   |   └── ...
 * │   |   |   └── [24, 9]
 * │   |   |       └── ...
 * │   │   └── [14, 9]
 * │   │       └── [14, 19]
 * │   │           └── ...
 * │   └── [4, 9]
 * │       └── [4, 19]
 * │           └── [4, 29]
 * │               └── ...
 * └── [0, 9]
 *     └── [0, 19]
 *         └── [0, 29]
 *             └── [0, 39]
 *                 └── ...
 *
 * Note how this recursively enumerates all combinations of stat boosts.
 * (For easy of reading, this tree is transposed so that up is left and left is up)
 * The depth of a node indicates the number of tier boosts this gave us, and subtrees of equal depth are better the further
 * left they are since the leftmost stat is the highest-prioritized one and the rightmost stat is the least-prioritized one.
 * Observe how the nodes within a tier keep shifting stats to the right as we move from left to right.
 *
 * The first time we boost a stat we only take as many points as are needed based on set stats that already exist;
 * subsequent boosts will always boost by +10.
 *
 * The fact that the first criterion is tree depth produces some really nice builds because it allows the process
 * to make use of ".5s" (NB the .5s aren't really .5s because with artifice mods, a .7 could also be useful) when it allows
 * reaching higher total tiers, but still prioritizes leftmost stats. E.g. if we have a bunch of ".5s" in low-priority stats,
 * LO will only assign half-tier mods to them if boosting higher-priority stats would result in a lower total tier.
 * E.g. for [res = 80, dis = 85, str = 85], what we really want to do with two mod slots is (in order):
 *   [+10 res, +10 res] = 2 tiers # if these fit, getting 2 tiers from resilience is best.
 *   ...
 *   [+5 dis, +5 str] = 2 tiers # otherwise, using the +5s is better than...
 *   ...
 *   [+5 res, +5 res] = 1 tier # only getting one tier from resilience
 *
 * As an optimization for the backtracking search, we do a dominance check so that we can skip evaluating subbranches if further-right stats
 * bring nothing new to the table. E.g. if we tried +10 resilience, then there's no point in seeing if +10 recovery instead
 * could give us a better set, since their mods cost the same and that stat needed the same number of points for the next tier.
 *
 * If there's an optimistic estimate of how many tiers can be gained by stat mods + artifice mods, this also aborts as soon
 * as a node with this tier total is reached. This gives a small efficiency boost when there aren't many slot-specific mods.
 */
function exploreAutoModsSearchTree(
  info: LoSessionInfo,
  items: ProcessItem[],
  /** The base stats from our set + fragments + ... */
  setStats: number[],
  /** The stats we have explored in this search process */
  explorationStats: number[],
  /** The highest allowed additional stat values */
  maxAddedStats: number[],
  /** How many artifice mods this set has */
  numArtificeMods: number,
  /** The different permutations of leftover energy after assigning activity mods permutations */
  remainingEnergyCapacities: number[][],
  /** The total amount of energy left over in this set */
  totalModEnergyCapacity: number,
  /** The stat index this branch of the search tree starts at */
  statIndex: number,
  /** How many boosts we have chosen before in explorationStats */
  depth: number
): SearchResult | undefined {
  const picks = chooseAutoMods(
    info,
    items,
    explorationStats,
    numArtificeMods,
    remainingEnergyCapacities,
    totalModEnergyCapacity
  );
  if (!picks) {
    return undefined;
  }

  let bestResult: SearchResult = {
    depth,
    picks,
  };
  const previousCosts: {
    expensive: boolean;
    cost: number;
  }[] = [];

  while (statIndex < setStats.length) {
    if (explorationStats[statIndex] >= maxAddedStats[statIndex]) {
      statIndex += 1;
      continue;
    }

    const subTreeCost = explorationStats[statIndex] === 0 ? 10 - (setStats[statIndex] % 10) : 10;
    const subTreeExpensive = isExpensiveMod(info.statOrder[statIndex]);

    // Dominance check: If an earlier branch strictly cost less, skip. Earlier branches are
    // higher-prioritized stats, so they're better when depth is equal, and the strictly less
    // cost condition ensures later branches can't end up producing a better total tier.
    if (
      previousCosts.some(
        (previousSubtree) =>
          (!previousSubtree.expensive || (previousSubtree.expensive && subTreeExpensive)) &&
          previousSubtree.cost <= subTreeCost
      )
    ) {
      statIndex += 1;
      continue;
    }

    const subTreeStats = explorationStats.slice();
    subTreeStats[statIndex] += subTreeCost;

    const explorationResult = exploreAutoModsSearchTree(
      info,
      items,
      setStats,
      subTreeStats,
      maxAddedStats,
      numArtificeMods,
      remainingEnergyCapacities,
      totalModEnergyCapacity,
      statIndex,
      depth + 1
    );
    // Is this a better solution than what we already have?
    if (explorationResult && bestResult.depth < explorationResult.depth) {
      bestResult = explorationResult;
    }
    // Remember that we checked a stat like this so we can skip dominated branches in later iterations.
    previousCosts.push({
      cost: subTreeCost,
      expensive: subTreeExpensive,
    });
    statIndex += 1;
  }
  return bestResult;
}

/*@__INLINE__*/
function isExpensiveMod(statHash: number) {
  return (
    statHash === StatHashes.Recovery ||
    statHash === StatHashes.Resilience ||
    statHash === StatHashes.Intellect
  );
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
