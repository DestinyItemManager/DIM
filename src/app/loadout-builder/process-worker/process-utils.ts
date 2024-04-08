import { generatePermutationsOfFive } from 'app/loadout/mod-permutations';
import { count } from 'app/utils/collections';
import { ArmorStatHashes, DesiredStatRange, MinMaxTier } from '../types';
import { AutoModsMap, ModsPick, buildAutoModsMap, chooseAutoMods } from './auto-stat-mod-utils';
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

function getRemainingEnergiesPerAssignment(
  info: LoSessionInfo,
  items: ProcessItem[],
): { setEnergy: number; remainingEnergiesPerAssignment: number[][] } {
  const remainingEnergiesPerAssignment: number[][] = [];

  let setEnergy = 0;
  for (const item of items) {
    setEnergy += item.remainingEnergyCapacity;
  }

  activityModLoop: for (const activityPermutation of info.activityModPermutations) {
    activityItemLoop: for (let i = 0; i < items.length; i++) {
      const activityMod = activityPermutation[i];
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

    const remainingEnergyCapacities = [0, 0, 0, 0, 0];
    for (let i = 0; i < items.length; i++) {
      remainingEnergyCapacities[i] =
        items[i].remainingEnergyCapacity - (activityPermutation[i]?.energyCost || 0);
    }
    remainingEnergyCapacities.sort((a, b) => b - a);
    remainingEnergiesPerAssignment.push(remainingEnergyCapacities);
  }

  return { setEnergy, remainingEnergiesPerAssignment };
}

/**
 * Optimizes stats individually and updates max tiers.
 * Returns true if it's possible to bump at least one stat to higher than the stat's `min`.
 */
export function updateMaxTiers(
  info: LoSessionInfo,
  items: ProcessItem[],
  setStats: number[],
  setTiers: number[],
  numArtificeMods: number,
  statFiltersInStatOrder: DesiredStatRange[],
  minMaxesInStatOrder: MinMaxTier[], // mutated
): boolean {
  const { remainingEnergiesPerAssignment, setEnergy } = getRemainingEnergiesPerAssignment(
    info,
    items,
  );

  let foundAnyImprovement = false;

  const requiredMinimumExtraStats = [0, 0, 0, 0, 0, 0];

  // First, track absolutely required stats (and update existing maxes)
  for (let statIndex = 0; statIndex < statFiltersInStatOrder.length; statIndex++) {
    const value = setStats[statIndex];
    const filter = statFiltersInStatOrder[statIndex];
    const minMax = minMaxesInStatOrder[statIndex];
    if (minMax.maxTier < filter.minTier) {
      // This is only called with sets that satisfy stat constraints,
      // so optimistically bump these up
      minMax.maxTier = filter.minTier;
    }
    const tier = setTiers[statIndex];
    if (tier > minMax.maxTier) {
      foundAnyImprovement ||= filter.minTier < filter.maxTier;
      minMax.maxTier = tier;
    }
    const neededValue = filter.minTier * 10 - value;
    if (neededValue > 0) {
      // All sets need at least these extra stats to hit minimums
      requiredMinimumExtraStats[statIndex] = neededValue;
    }
  }

  // Then, for every stat where we haven't shown that we can hit T10...
  for (let statIndex = 0; statIndex < statFiltersInStatOrder.length; statIndex++) {
    const setStat = setStats[statIndex];
    const minMax = minMaxesInStatOrder[statIndex];
    const statFilter = statFiltersInStatOrder[statIndex];
    if (minMax.maxTier >= 10) {
      continue;
    }

    // Since we calculate the maximum tier we can hit for a stat in isolation,
    // require all other stats to hit their constrained minimums, but for this
    // stat we start from the highest tier we've observed.
    const explorationStats = requiredMinimumExtraStats.slice();
    explorationStats[statIndex] = minMax.maxTier * 10 - setStat;

    while (minMax.maxTier < 10) {
      const pointsToNextTier = explorationStats[statIndex] === 0 ? 10 - (setStat % 10) : 10;
      explorationStats[statIndex] += pointsToNextTier;
      const picks = chooseAutoMods(
        info,
        explorationStats,
        numArtificeMods,
        remainingEnergiesPerAssignment,
        setEnergy - info.totalModEnergyCost,
      );
      if (picks) {
        const tierVal = Math.floor((setStat + explorationStats[statIndex]) / 10);
        // An improvement is only actually an improvement if the tier wouldn't end up
        // ignored due to max.
        foundAnyImprovement ||=
          tierVal > statFilter.minTier && statFilter.minTier < statFilter.maxTier;
        minMax.maxTier = tierVal;
      } else {
        break;
      }
    }
  }

  return foundAnyImprovement;
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
 * Optimizes the auto stat mod picks to maximize total tier, prioritizing stats earlier in the stat order.
 */
export function pickOptimalStatMods(
  info: LoSessionInfo,
  items: ProcessItem[],
  setStats: number[],
  desiredStatRanges: DesiredStatRange[],
): { mods: number[]; numBonusTiers: number; bonusStats: number[] } | undefined {
  const { remainingEnergiesPerAssignment, setEnergy } = getRemainingEnergiesPerAssignment(
    info,
    items,
  );

  // The amount of additional stat points after which stats don't give us a benefit anymore.
  const maxAddedStats = [0, 0, 0, 0, 0, 0];
  const explorationStats = [0, 0, 0, 0, 0, 0];

  for (let statIndex = setStats.length - 1; statIndex >= 0; statIndex--) {
    const filter = desiredStatRanges[statIndex];
    if (filter.maxTier > 0) {
      const value = setStats[statIndex];
      if (filter.minTier > 0) {
        const neededValue = filter.minTier * 10 - value;
        if (neededValue > 0) {
          // All sets need at least these extra stats to hit minimums
          explorationStats[statIndex] = neededValue;
        }
      }
      maxAddedStats[statIndex] = filter.maxTier * 10 - value;
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
      numBonusTiers: bestBoosts.depth,
      bonusStats,
    };
  } else {
    return undefined;
  }
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

    const pointsMissing = explorationStats[statIndex] === 0 ? 10 - (setStats[statIndex] % 10) : 10;

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
