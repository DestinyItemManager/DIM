import { MAX_STAT } from 'app/loadout/known-values';
import { generatePermutationsOfFive } from 'app/loadout/mod-permutations';
import { count } from 'app/utils/collections';
import { ArmorStatHashes, DesiredStatRange, MinMaxStat } from '../types';
import { AutoModsMap, buildAutoModsMap, chooseAutoMods, ModsPick } from './auto-stat-mod-utils';
import { AutoModData, ModAssignmentStatistics, ProcessItem, ProcessMod } from './types';

/**
 * Data that stays the same in a given LO run.
 */
export interface LoSessionInfo {
  autoModOptions: AutoModsMap;
  hasActivityMods: boolean;
  /** The total cost of all user-picked general and activity mods. */
  totalModEnergyCost: number;
  /** The cost of user-picked general mods, sorted descending. */
  generalModCosts: number[];
  /** How many general mod slots are available for auto stat mods. */
  numAvailableGeneralMods: number;
  /** All uniquely distinguishable activity mod permutations */
  activityModPermutations: (ProcessMod | null)[][];
  /** How many activity mods we have per tag. */
  activityTagCounts: { [tag: string]: number };
}

export function precalculateStructures(
  autoModOptions: AutoModData,
  generalMods: ProcessMod[],
  activityMods: ProcessMod[],
  autoStatMods: boolean,
  statOrder: ArmorStatHashes[],
): LoSessionInfo {
  const generalModCosts = generalMods.map((m) => m.energyCost).sort((a, b) => b - a);
  const numAvailableGeneralMods = autoStatMods ? 5 - generalModCosts.length : 0;

  return {
    autoModOptions: buildAutoModsMap(autoModOptions, numAvailableGeneralMods, statOrder),
    hasActivityMods: activityMods.length > 0,
    generalModCosts,
    numAvailableGeneralMods,
    totalModEnergyCost:
      generalModCosts.reduce((acc, cost) => acc + cost, 0) +
      activityMods.reduce((acc, mod) => acc + mod.energyCost, 0),
    activityModPermutations: generateProcessModPermutations(activityMods),
    activityTagCounts: activityMods.reduce<{ [tag: string]: number }>((acc, mod) => {
      if (mod.tag) {
        acc[mod.tag] = (acc[mod.tag] || 0) + 1;
      }
      return acc;
    }, {}),
  };
}

/**
 * For each possible permutation of activity mods, see which ones can fit on
 * this item set, and how much energy you'd have remaining in each piece if you
 * do.
 */
function getRemainingEnergiesPerAssignment(
  activityModPermutations: (ProcessMod | null)[][],
  items: readonly ProcessItem[],
): {
  /** Total remaining energy capacity across the set */
  setEnergy: number;
  /**
   * For each valid permutation, how much energy is left on per item? These lists are sorted by remaining energy so they do not correspond to the input items.
   */
  remainingEnergiesPerAssignment: number[][];
} {
  const remainingEnergiesPerAssignment: number[][] = [];

  let setEnergy = 0;
  for (const item of items) {
    setEnergy += item.remainingEnergyCapacity;
  }

  activityModLoop: for (const activityPermutation of activityModPermutations) {
    const remainingEnergyCapacities = [0, 0, 0, 0, 0];

    // Check each item to see if it's possible to slot the activity mods in this
    // permutation.
    for (let i = 0; i < items.length; i++) {
      const activityMod = activityPermutation[i];
      const item = items[i];
      remainingEnergyCapacities[i] = item.remainingEnergyCapacity;
      if (activityMod) {
        const tag = activityMod.tag!;
        const energyCost = activityMod.energyCost;

        // The activity mod for this slot won't fit in the item so move on to
        // the next permutation.
        if (
          energyCost > item.remainingEnergyCapacity ||
          !item.compatibleModSeasons?.includes(tag)
        ) {
          continue activityModLoop;
        }

        remainingEnergyCapacities[i] -= activityMod.energyCost;
      }
    }
    remainingEnergyCapacities.sort((a, b) => b - a);
    remainingEnergiesPerAssignment.push(remainingEnergyCapacities);
  }

  return { setEnergy, remainingEnergiesPerAssignment };
}

/**
 * Updates the max stat range by trying to individually get the highest value in
 * each stat.
 * @returns true if it's possible to bump at least one stat to higher
 * than the desired range's minStat for that stat.
 */
export function updateMaxStats(
  info: LoSessionInfo,
  armor: readonly ProcessItem[],
  /** Stats for the current set. */
  setStats: readonly number[],
  /** Total number of available artifice mods, */
  numArtificeMods: number,
  /** The min/max stat value the user has requested. */
  desiredStatRanges: readonly DesiredStatRange[],
  /** Current stat ranges across all sets we've seen so far. */
  statRanges: MinMaxStat[], // mutated
): boolean {
  let foundAnyImprovement = false;

  // How many extra points we need to add to each stat to hit the minimums.
  const requiredMinimumExtraStats = [0, 0, 0, 0, 0, 0];

  // First, track absolutely required stats (and update existing maxes)
  for (let statIndex = 0; statIndex < desiredStatRanges.length; statIndex++) {
    const value = setStats[statIndex];
    const filter = desiredStatRanges[statIndex];
    const statRange = statRanges[statIndex];
    if (statRange.maxStat < filter.minStat) {
      // This is only called with sets that satisfy stat constraints,
      // so optimistically bump these up
      statRange.maxStat = filter.minStat;
    }
    if (value > statRange.maxStat) {
      statRange.maxStat = value;
      // statRange.maxStat is guaranteed to be at least filter.minStat above, so
      // if the value is larger than that, we've found an improvement - unless
      // the filter also has a maxStat that's equal to the minStat, in which
      // case it's impossible to improve this stat within the user's desired
      // range.
      foundAnyImprovement ||= filter.minStat < filter.maxStat;
    }
    const neededValue = filter.minStat - value;
    if (neededValue > 0) {
      // All sets need at least these extra stats to hit minimums
      requiredMinimumExtraStats[statIndex] = neededValue;
    }
  }

  if (info.numAvailableGeneralMods === 0 && numArtificeMods === 0) {
    // If there are no general mods or artifice mods available, we can't improve
    // stats any further.
    return foundAnyImprovement;
  }

  const { remainingEnergiesPerAssignment, setEnergy } = getRemainingEnergiesPerAssignment(
    info.activityModPermutations,
    armor,
  );

  // Then, for every stat where we haven't shown that we can hit MAX_STAT with any
  // set, try to see if we can exceed the previous max by adding auto stat mods.
  for (let statIndex = 0; statIndex < desiredStatRanges.length; statIndex++) {
    const value = setStats[statIndex];
    const filter = desiredStatRanges[statIndex];
    const statRange = statRanges[statIndex];
    if (statRange.maxStat >= MAX_STAT) {
      // We can already hit MAX_STAT for this stat, so skip it.
      continue;
    }

    // Since we calculate the maximum stat value we can hit for a stat in
    // isolation, require all other stats to hit their constrained minimums, but
    // for this stat we start from the highest stat max we've observed. Remember
    // that this array is expressed in terms of additional stat points.
    const explorationStats = requiredMinimumExtraStats.slice();
    explorationStats[statIndex] = statRange.maxStat - value;

    // TODO: Rather than iterating one point at a time, we could run our greedy
    // assignment search that maximizes stats but with stat ranges that prevent
    // us from going over our minimum? Or maybe do a binary search for the
    // maximum we can reach?
    while (statRange.maxStat < MAX_STAT) {
      // Now that tiers no longer matter (since Edge of Fate), we consider any
      // stat point increase a "tier". This should be a short-term change -
      // ideally we'd reconsider all these algorithms to see if they could be
      // simplified now that the tier concept is gone.
      const pointsToNextTier = 1;
      explorationStats[statIndex] += pointsToNextTier;

      // Now see if there's any way to hit that stat with mods.
      if (
        !chooseAutoMods(
          info,
          explorationStats,
          numArtificeMods,
          remainingEnergiesPerAssignment,
          setEnergy - info.totalModEnergyCost,
        )
      ) {
        break;
      }

      const newValue = value + explorationStats[statIndex];
      // filter.minStat < filter.maxStat just checks to make sure you can
      // actually improve the stat given the user's new constraints.
      foundAnyImprovement ||= filter.minStat < filter.maxStat && newValue > filter.minStat;
      statRange.maxStat = newValue;

      // Keep going until we hit the max or we can no longer find mods to improve the stat.
    }
  }

  return foundAnyImprovement;
}

/**
 * This figures out if all user-chosen general, combat and activity mods can be
 * assigned to an armour set and auto stat mods can be picked to provide the
 * neededStats. This is a version of pickOptimalStatMods that only cares about
 * hitting the neededStats (minimum stat targets) and not finding the optimal
 * stat mods for the highest tier.
 *
 * The param info.activityModPermutations is assumed to be the result from
 * processUtils.ts#generateModPermutations, i.e. all permutations of activity
 * mods. By preprocessing all the assignments we skip a lot of work in the
 * middle of the big process algorithm.
 *
 * Returns a ModsPick representing the automatically picked stat mods in the
 * success case, even if no auto stat mods were requested/needed, in which case
 * the arrays will be empty.
 *
 * TODO: Doesn't need to return anything in its current usage
 */
export function pickAndAssignSlotIndependentMods(
  info: LoSessionInfo,
  modStatistics: ModAssignmentStatistics, // mutated
  items: readonly ProcessItem[],
  neededStats: number[] | undefined,
  numArtifice: number,
): ModsPick[] | undefined {
  modStatistics.earlyModsCheck.timesChecked++;

  let setEnergy = 0;
  for (const item of items) {
    setEnergy += item.remainingEnergyCapacity;
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
      const energyCost = activityMod.energyCost;

      // The activity mods won't fit in the item set so move on to the next set of mods
      if (energyCost > item.remainingEnergyCapacity || !item.compatibleModSeasons?.includes(tag)) {
        continue activityModLoop;
      }
    }

    assignedModsAtLeastOnce = true;

    // This is a valid activity and combat mod assignment. See how much energy is left over per piece
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      remainingEnergyCapacities[idx] =
        item.remainingEnergyCapacity - (activityPermutation[idx]?.energyCost || 0);
    }
    remainingEnergyCapacities.sort((a, b) => b - a);

    if (neededStats) {
      const result = chooseAutoMods(
        info,
        neededStats,
        numArtifice,
        [remainingEnergyCapacities],
        setEnergy - info.totalModEnergyCost,
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
 * Optimizes the auto stat mod picks to maximize total stats, prioritizing stats
 * earlier in the stat order. This differs from
 * `pickAndAssignSlotIndependentMods` in that it assumes that the stat minimums
 * can definitely be hit, and instead tries to maximize the total stats by
 * picking the best auto stat mods.
 */
export function pickOptimalStatMods(
  info: LoSessionInfo,
  items: ProcessItem[],
  setStats: number[],
  desiredStatRanges: DesiredStatRange[],
): { mods: number[]; bonusStats: number[] } | undefined {
  const { remainingEnergiesPerAssignment, setEnergy } = getRemainingEnergiesPerAssignment(
    info.activityModPermutations,
    items,
  );

  // The amount of additional stat points after which stats don't give us a benefit anymore.
  const maxAddedStats = [0, 0, 0, 0, 0, 0];
  const explorationStats = [0, 0, 0, 0, 0, 0];

  for (let statIndex = setStats.length - 1; statIndex >= 0; statIndex--) {
    const filter = desiredStatRanges[statIndex];
    if (filter.maxStat > 0) {
      const value = setStats[statIndex];
      if (filter.minStat > 0) {
        const neededValue = filter.minStat - value;
        if (neededValue > 0) {
          // All sets need at least these extra stats to hit minimums
          explorationStats[statIndex] = neededValue;
        }
      }
      maxAddedStats[statIndex] = filter.maxStat - value;
    }
  }

  const numArtificeMods = count(items, (i) => i.isArtifice);
  const bestBoosts = exploreAutoModsSearchTree(
    info,
    items,
    setStats,
    explorationStats,
    maxAddedStats,
    numArtificeMods,
    remainingEnergiesPerAssignment,
    setEnergy - info.totalModEnergyCost,
    0,
    0,
  );

  if (bestBoosts) {
    const bonusStats = [0, 0, 0, 0, 0, 0];
    for (const pick of bestBoosts.picks) {
      bonusStats[pick.targetStatIndex] += pick.exactStatPoints;
    }
    return {
      mods: bestBoosts.picks.flatMap((pick) => pick.modHashes),
      bonusStats,
    };
  } else {
    return undefined;
  }
}

// const majorMinorRatio = majorStatBoost / minorStatBoost;

/**
 * In the post-Edge of Fate world, there are no more stat tiers - every stat
 * point gives some linear benefit. So we can use a much simpler greedy
 * algorithm to pick stat mods.
 */

// TODO: I think this is roughly right - each armor piece can have up to 1
// artifice mod and one general mod. If we start with a list of items' remaining
// energy capacities, we can just greedily pick the best stat mods for each stat
// until we hit the max or run out of mods or energy for mods. The one bit
// that's glaringly missing is we probably need to do this for each combination
// of activity mod permutations, since those can affect the remaining energy
// capacities of the items. So we need to loop over all activity mod
// permutations and then for each one, greedily pick stat mods. We can maybe
// even short-circuit based on a total stat high water mark (or if we've already
// used 5 major mods... ). This might be fast enough that we can do it within
// the process loop!
//
// This also has the concept of avoiding wasting stats, which is a bit different
// from the old setup. It's unclear whether this is something we'd want to make
// optional (at the very least we'd need to disable it for some calculations).
// I'm also not sure we do the *best* job of avoiding wasted stats, since there
// might be a situation where it'd be better to not assign an artifice mod to a
// stat but instead give it a major stat mod on its own, or something like that.
// (e.g. if the stat is at 190, it's better to give it a +10 mod than a +3 and
// +5 or a +3 and +10). So maybe the exploration algorithm is still worthwhile
// with a tier size of 1?
// function greedyPickStatMods(
//   /** The base stats from our set + fragments + ... */
//   setStats: number[],
//   desiredStatRanges: DesiredStatRange[],
//   numArtificeMods: number,
//   numAvailableGeneralMods: number,
//   // remainingEnergiesPerAssignment: number[][],
// ): { mods: number[]; bonusStats: number[] } | undefined {
//   const mods: number[] = [];
//   const bonusStats = [0, 0, 0, 0, 0, 0];

//   // Then spend artifice mods to boost stats greedily in stat
//   // priority order.
//   let artificeModsAvailable = numArtificeMods;
//   let statsFromArtificeMods = 0;
//   for (let pass = 0; pass < 2; pass++) {
//     for (let index = 0; index < 6 && artificeModsAvailable > 0; index++) {
//       const value = setStats[index] + bonusStats[index];
//       const filter = desiredStatRanges[index];
//       if (value < filter.maxStat) {
//         const pointsToMax = filter.maxStat - value;
//         // How many artifice mods would that be?
//         const numArtificeModsUsed = Math.min(
//           Math.ceil(pointsToMax / artificeStatBoost),
//           artificeModsAvailable,
//         );
//         let statBoost = numArtificeModsUsed * artificeStatBoost;
//         // Wasted stats. We could maybe get a higher total tier if
//         // we spent this elsewhere. On the second pass we allow
//         // wasting stats.
//         if (pass === 0 && statBoost > pointsToMax) {
//           // Put it back
//           artificeModsAvailable++;
//           statBoost -= artificeStatBoost;
//         }
//         bonusStats[index] += statBoost;
//         // TODO: Add to mods array
//         statsFromArtificeMods += statBoost;
//         artificeModsAvailable -= numArtificeModsUsed;
//       }
//     }
//   }

//   // Also check how many +10 and +5 general mods we can use to boost stats.
//   let generalModsAvailable = numAvailableGeneralMods;
//   let statsFromGeneralMods = 0;
//   for (let pass = 0; pass < 2; pass++) {
//     for (let index = 0; index < 6; index++) {
//       const value = setStats[index] + bonusStats[index];
//       const filter = desiredStatRanges[index];
//       if (value < filter.maxStat) {
//         const pointsToMax = filter.maxStat - value;
//         // How many +5 mods would that be?
//         let minorStatMods = Math.ceil(pointsToMax / minorStatBoost);
//         // Use +10 mods in place of two +5 mods
//         const majorStatMods = Math.floor(minorStatMods / majorMinorRatio);
//         minorStatMods -= majorStatMods * majorMinorRatio;

//         const numGeneralModsUsed = Math.min(majorStatMods + minorStatMods, generalModsAvailable);
//         let numMajorModsUsed = Math.min(majorStatMods, generalModsAvailable);
//         let numMinorModsUsed = Math.min(minorStatMods, generalModsAvailable - numMajorModsUsed);
//         let statBoost = numMajorModsUsed * majorStatBoost + numMinorModsUsed * minorStatBoost;
//         // Wasted stats. We could maybe get a higher total tier if
//         // we spent this elsewhere. On the second pass we allow
//         // wasting stats. TODO: We could have a setting to allow
//         // wasting stats in order to max out other stats but since
//         // their effects are linear I don't know that it matters.
//         if (pass === 0 && statBoost > pointsToMax) {
//           // Put it back
//           if (numMinorModsUsed > 0) {
//             // If we used any minor mods, put one back
//             numMinorModsUsed--;
//           } else {
//             // Otherwise, swap a major mod for a minor mod
//             numMajorModsUsed--;
//             numMinorModsUsed++;
//           }
//           statBoost = numMajorModsUsed * majorStatBoost + numMinorModsUsed * minorStatBoost;
//         }
//         bonusStats[index] += statBoost;
//         // TODO: Add to mods array
//         statsFromGeneralMods += statBoost;
//         generalModsAvailable -= numGeneralModsUsed;
//       }
//     }
//   }

//   return { mods, bonusStats };
// }

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
 */
function exploreAutoModsSearchTree(
  info: LoSessionInfo,
  items: ProcessItem[],
  /** The base stats from our set + fragments + ... */
  setStats: number[],
  /** The stat boosts in the current search tree node */
  explorationStats: number[],
  /**
   * The highest allowed additional stat values. we are not allowed to boost stats beyond this,
   * otherwise we would go over the stats' tier maxes (or T10 if no max)
   */
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
  depth: number,
): SearchResult | undefined {
  const picks = chooseAutoMods(
    info,
    explorationStats,
    numArtificeMods,
    remainingEnergyCapacities,
    totalModEnergyCapacity,
  );
  if (!picks) {
    return undefined;
  }

  let bestResult: SearchResult = {
    depth,
    picks,
  };

  // The cost to get to the next tier has two dimensions:
  // * the cost of individual mods (via cheaperStatRelations)
  // * number of stat points missing to go to the next tier (`pointsMissing`)
  const previousCosts: {
    statIndex: number;
    pointsMissing: number;
  }[] = [];

  for (; statIndex < setStats.length; statIndex++) {
    if (explorationStats[statIndex] >= maxAddedStats[statIndex]) {
      continue;
    }

    // Now that tiers no longer matter (since Edge of Fate), we consider any
    // stat point increase a "tier". This should be a short-term change -
    // ideally we'd reconsider all these algorithms to see if they could be
    // simplified now that the tier concept is gone.
    const pointsMissing = 1;

    // Dominance check: If an earlier-explored (=higher-priority) branch needs fewer stat points
    // to the next tier AND doesn't have more expensive mods than this current one, we don't even need to
    // look at this branch.
    if (
      previousCosts.some(
        (previousSubtree) =>
          info.autoModOptions.cheaperStatRelations[statIndex].includes(previousSubtree.statIndex) &&
          previousSubtree.pointsMissing <= pointsMissing,
      )
    ) {
      continue;
    }

    const subTreeStats = explorationStats.slice();
    subTreeStats[statIndex] += pointsMissing;

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
      depth + 1,
    );
    // Is this a better solution than what we already have?
    if (explorationResult && bestResult.depth < explorationResult.depth) {
      bestResult = explorationResult;
    }
    // Remember that we checked a stat like this so we can skip dominated branches in later iterations.
    previousCosts.push({
      pointsMissing,
      statIndex,
    });
  }
  return bestResult;
}

// only exported for testing purposes
export function generateProcessModPermutations(mods: (ProcessMod | null)[]) {
  // Creates a string from the mod permutation containing the unique properties
  // that we care about, so we can reduce to the minimum number of permutations.
  // If two different mods that fit in the same socket have the same cost, they
  // are identical from the mod assignment perspective.
  // This works because we check to see if we have already recorded this string
  // in heaps algorithm before we add the permutation to the result.
  const createPermutationKey = (permutation: (ProcessMod | null)[]) =>
    permutation.map((mod) => (mod ? `${mod.energyCost}${mod.tag}` : undefined)).join(',');
  return generatePermutationsOfFive(mods, createPermutationKey);
}
