import { generatePermutationsOfFive } from 'app/loadout/mod-permutations';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { ArmorStatHashes, MinMaxIgnored } from '../types';
import {
  createGeneralModsCache,
  GeneralModsCache,
  getViableGeneralModPicks,
  ModsPick,
} from './auto-stat-mod-utils';
import { ProcessItem, ProcessMod } from './types';

interface SortParam {
  energy?: {
    type: DestinyEnergyType;
    val: number;
  };
}

export interface ProcessItemSubset extends SortParam {
  id: string;
  compatibleModSeasons?: string[];
}

export interface PrecalculatedInfo {
  cache: GeneralModsCache;
  combatModPermutations: (ProcessMod | null)[][];
  combatModEnergyCounts: EnergyTypeCounts;
  hasActivityMods: boolean;
  activityModPermutations: (ProcessMod | null)[][];
  activityModEnergyCounts: EnergyTypeCounts;
  activityTagCounts: { [tag: string]: number };
}

/**
 * This sorts process mods and items in the same manner as we try for greedy results.
 */
export function sortProcessModsOrItems(a: SortParam, b: SortParam) {
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

type EnergyTypeCounts = [
  arcCount: number,
  solarCount: number,
  voidCount: number,
  stasisCount: number,
  anyCount: number
];

export function precalculateStructures(
  generalMods: ProcessMod[],
  combatMods: ProcessMod[],
  activityMods: ProcessMod[],
  autoStatMods: boolean,
  statOrder: ArmorStatHashes[]
): PrecalculatedInfo {
  return {
    cache: createGeneralModsCache(generalMods, statOrder, autoStatMods),
    combatModPermutations: generateProcessModPermutations(combatMods.sort(sortProcessModsOrItems)),
    combatModEnergyCounts: getEnergyCounts(combatMods),
    hasActivityMods: activityMods.length > 0,
    activityModPermutations: generateProcessModPermutations(
      activityMods.sort(sortProcessModsOrItems)
    ),
    activityModEnergyCounts: getEnergyCounts(activityMods),
    activityTagCounts: activityMods.reduce((acc, mod) => {
      if (mod.tag) {
        acc[mod.tag] = (acc[mod.tag] || 0) + 1;
      }
      return acc;
    }, {}),
  };
}

function getEnergyCounts(modsOrItems: (ProcessMod | ProcessItemSubset)[]): EnergyTypeCounts {
  let arcCount = 0;
  let solarCount = 0;
  let voidCount = 0;
  let stasisCount = 0;
  let anyCount = 0;

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
      case DestinyEnergyType.Any:
        anyCount += 1;
        break;
      case DestinyEnergyType.Stasis:
        stasisCount += 1;
        break;
      default:
        break;
    }
  }

  return [arcCount, solarCount, voidCount, stasisCount, anyCount];
}

// Used for null values
const defaultModEnergy = { val: 0, type: DestinyEnergyType.Any };

export type SlotIndependentPickAssignResult = 'mods_dont_fit' | 'cannot_hit_stats' | ModsPick;

/**
 * This figures out if all general, combat and activity mods can be assigned to an armour set and auto stat mods
 * can be picked to provide the neededStats.
 *
 * The params combatModPermutations, activityModPermutations are assumed to be the results
 * from processUtils.ts#generateModPermutations, i.e. all permutations of combat or activity mods.
 * By preprocessing all the assignments we skip a lot of work in the middle of the big process algorithm.
 */
export function pickAndAssignSlotIndependentMods(
  {
    activityModEnergyCounts,
    activityModPermutations,
    activityTagCounts,
    cache,
    combatModEnergyCounts,
    combatModPermutations,
    hasActivityMods,
  }: PrecalculatedInfo,
  items: ProcessItem[],
  neededStats: number[] | undefined
): SlotIndependentPickAssignResult {
  // Sort the items like the mods are to try and get a greedy result
  // Theory here is that aligning energy types between items and mods and assigning the mods with the
  // highest cost to the items with the highest amount of energy available will find results faster
  const sortedItems = Array.from(items).sort(sortProcessModsOrItems);

  const [arcItems, solarItems, voidItems, stasisItems, anyItems] = getEnergyCounts(sortedItems);
  const [arcCombatMods, solarCombatMods, voidCombatMods, stasisCombatMods] = combatModEnergyCounts;
  const [arcActivityMods, solarActivityMods, voidActivityMods, stasisActivityMods] =
    activityModEnergyCounts;

  // A quick check to see if we have enough of each energy type for the mods so we can exit early if not
  if (
    voidItems + anyItems < voidCombatMods ||
    voidItems + anyItems < voidActivityMods ||
    solarItems + anyItems < solarCombatMods ||
    solarItems + anyItems < solarActivityMods ||
    arcItems + anyItems < arcCombatMods ||
    arcItems + anyItems < arcActivityMods ||
    stasisItems + anyItems < stasisCombatMods ||
    stasisItems + anyItems < stasisActivityMods
  ) {
    return 'mods_dont_fit';
  }

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
        return 'mods_dont_fit';
      }
    }
  }

  // Figure out if there's any way for stat mods to provide the needed stats. If neededStats are
  // all 0, this returns the user-picked general mod costs only.
  const validGeneralModPicks = neededStats && getViableGeneralModPicks(cache, neededStats);
  if (validGeneralModPicks?.length === 0) {
    return 'cannot_hit_stats';
  }
  let assignedModsAtLeastOnce = false;
  const remainingEnergyCapacities = [0, 0, 0, 0, 0];

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
        item.energy &&
        item.energy.val + activityEnergy.val <= item.energy.capacity &&
        (item.energy.type === activityEnergy.type ||
          activityEnergy.type === DestinyEnergyType.Any ||
          item.energy.type === DestinyEnergyType.Any);

      // The activity mods wont fit in the item set so move on to the next set of mods
      if (!activityEnergyIsValid || !item.compatibleModSeasons?.includes(tag)) {
        continue activityModLoop;
      }
    }

    combatModLoop: for (const combatPermutation of combatModPermutations) {
      combatItemLoop: for (let i = 0; i < sortedItems.length; i++) {
        const combatMod = combatPermutation[i];

        // If a mod is null there is nothing being socketed into the item so move on
        if (!combatMod) {
          continue combatItemLoop;
        }

        const item = sortedItems[i];
        const combatEnergy = combatMod.energy || defaultModEnergy;
        const tag = combatMod.tag!;
        const activityEnergy = activityPermutation[i]?.energy || defaultModEnergy;

        // Energy is valid when the item has enough energy capacity for the activity and combat
        // mods, the items energy type accommodates the mods energy, and if an activity mod is
        // present the energy types of each mod are compatible, eg incompatible could be arc + void.
        const combatEnergyIsValid =
          item.energy &&
          item.energy.val + combatEnergy.val + activityEnergy.val <= item.energy.capacity &&
          (item.energy.type === combatEnergy.type ||
            combatEnergy.type === DestinyEnergyType.Any ||
            item.energy.type === DestinyEnergyType.Any) &&
          (activityEnergy.type === combatEnergy.type ||
            combatEnergy.type === DestinyEnergyType.Any ||
            activityEnergy.type === DestinyEnergyType.Any);

        // The combat mods wont fit in the item set so move on to the next set of mods
        if (!combatEnergyIsValid || !item.compatibleModSeasons?.includes(tag)) {
          continue combatModLoop;
        }
      }

      assignedModsAtLeastOnce = true;

      // This is a valid activity and combat mod assignment. See how much energy is left over per piece
      sortedItems.forEach(
        (i, idx) =>
          (remainingEnergyCapacities[idx] =
            (i.energy?.capacity || 0) -
            (i.energy?.val || 0) -
            (activityPermutation[idx]?.energy?.val || 0) -
            (combatPermutation[idx]?.energy?.val || 0))
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
        validPick = cache.generalModCosts.every(
          (cost, idx) => cost <= remainingEnergyCapacities[idx]
        )
          ? { costs: cache.generalModCosts, modHashes: [] }
          : undefined;
      }

      if (validPick) {
        return validPick;
      }
    }
  }

  return assignedModsAtLeastOnce ? 'cannot_hit_stats' : 'mods_dont_fit';
}

/**
 * Optimizes the auto stat mod picks to maximize the prioritized stats in order.
 * This function is super slow, so it's best only called for a limited number of sets.
 * Returns mod hashes that are able to increase
 */
export function pickOptimalStatMods(
  { activityModPermutations, cache, combatModPermutations }: PrecalculatedInfo,
  items: ProcessItem[],
  setStats: number[],
  statFiltersInStatOrder: MinMaxIgnored[]
): number[] | undefined {
  // High-level overview of this algorithm:
  // We know:
  // * There exists at least one feasible mod assignment.
  // * There exists at least one pick of auto stat mods to hit the necessary stat minimums.
  // We do:
  // * Collect all feasible mod assignments (in terms of their remaining energy capacities)
  // * Start with the stats needed to hit stat minimums.
  // * Iteratively try and increase prioritized stats.
  // E.g. if we have T9 recovery, T7.5 intellect, T4 resilience, we'll try in order
  // * T10, T7.5, T4 (let's assume for the sake of this example that this succeeds)
  // * T10, T8,   T4 (assume success)
  // * T10, T9,   T4 (assume fail)
  // * T10, T8,   T5 (assume success)
  // * T10, T8,   T6 (assume fail)
  // ...and then we try to increase the last three stats just like that, assume they fail too.

  const remainingEnergiesPerAssignment: number[][] = [];

  const sortedItems = Array.from(items).sort(sortProcessModsOrItems);

  // This loop is copy-pasted from above because we need to do the same thing as above
  // We don't have to do any of the early exits though, since we know they succeed.
  activityModLoop: for (const activityPermutation of activityModPermutations) {
    activityItemLoop: for (let i = 0; i < sortedItems.length; i++) {
      const activityMod = activityPermutation[i];
      if (!activityMod) {
        continue activityItemLoop;
      }

      const item = sortedItems[i];
      const tag = activityMod.tag!;
      const activityEnergy = activityMod.energy || defaultModEnergy;

      const activityEnergyIsValid =
        item.energy &&
        item.energy.val + activityEnergy.val <= item.energy.capacity &&
        (item.energy.type === activityEnergy.type ||
          activityEnergy.type === DestinyEnergyType.Any ||
          item.energy.type === DestinyEnergyType.Any);

      if (!activityEnergyIsValid || !item.compatibleModSeasons?.includes(tag)) {
        continue activityModLoop;
      }
    }

    combatModLoop: for (const combatPermutation of combatModPermutations) {
      combatItemLoop: for (let i = 0; i < sortedItems.length; i++) {
        const combatMod = combatPermutation[i];

        if (!combatMod) {
          continue combatItemLoop;
        }

        const item = sortedItems[i];
        const combatEnergy = combatMod.energy || defaultModEnergy;
        const tag = combatMod.tag!;
        const activityEnergy = activityPermutation[i]?.energy || defaultModEnergy;

        const combatEnergyIsValid =
          item.energy &&
          item.energy.val + combatEnergy.val + activityEnergy.val <= item.energy.capacity &&
          (item.energy.type === combatEnergy.type ||
            combatEnergy.type === DestinyEnergyType.Any ||
            item.energy.type === DestinyEnergyType.Any) &&
          (activityEnergy.type === combatEnergy.type ||
            combatEnergy.type === DestinyEnergyType.Any ||
            activityEnergy.type === DestinyEnergyType.Any);

        if (!combatEnergyIsValid || !item.compatibleModSeasons?.includes(tag)) {
          continue combatModLoop;
        }
      }

      const remainingEnergyCapacities = sortedItems.map(
        (i, idx) =>
          (i.energy?.capacity || 0) -
          (i.energy?.val || 0) -
          (activityPermutation[idx]?.energy?.val || 0) -
          (combatPermutation[idx]?.energy?.val || 0)
      );

      // Sort the costs array descending, same as our auto stat mod picks
      remainingEnergyCapacities.sort((a, b) => b - a);
      remainingEnergiesPerAssignment.push(remainingEnergyCapacities);
    }
  }

  let committedStats = [0, 0, 0, 0, 0, 0];
  let modsPick: ModsPick | undefined;
  const maxAddedStats = [0, 0, 0, 0, 0, 0];

  for (let index = 0; index < 6; index++) {
    const value = Math.min(Math.max(setStats[index], 0), 100);
    const filter = statFiltersInStatOrder[index];

    if (!filter.ignored) {
      const neededValue = filter.min * 10 - value;
      if (neededValue > 0) {
        // As per function preconditions, we know that we can hit these minimum stats
        committedStats[index] = neededValue;
      }
      maxAddedStats[index] = filter.max * 10 - value;
    }
  }

  let statIndex = 0;
  while (statIndex < committedStats.length) {
    if (committedStats[statIndex] >= maxAddedStats[statIndex]) {
      // We can't go any higher with this stat, so go to the next stat
      statIndex++;
    } else {
      // Try to increase this stat by +5 or +10
      const tentativeStats = committedStats.slice();
      if (setStats[statIndex] % 10 >= 5 && tentativeStats[statIndex] === 0) {
        // Our set has a .5 tier in this stat and we didn't already increase this stat,
        // so fill up the half tier first.
        tentativeStats[statIndex] += 5;
      } else {
        // Three cases:
        // 1. Set has a full tier (not a .5) in this stat
        // 2. minimum stats code got us to a full tier
        // 3. other branch got us to a full tier.
        // So we can just go +10 safely.
        tentativeStats[statIndex] += 10;
      }

      // Now, try to actually fit mods for these stats
      const validPicks = getViableGeneralModPicks(cache, tentativeStats);
      const pick = validPicks.find((pick) =>
        remainingEnergiesPerAssignment.some((remainingEnergies) =>
          pick.costs.every((cost, idx) => cost <= remainingEnergies[idx])
        )
      );
      if (pick) {
        // It is in fact possible to fit mods with these better stats,
        // so commit our stat increase here
        modsPick = pick;
        committedStats = tentativeStats;
      } else {
        // This increase was not possible, so go to the next stat
        statIndex++;
      }
    }
  }
  return modsPick?.modHashes;
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
          const energyType = mod.energy?.type || DestinyEnergyType.Any;
          const energyCost = mod.energy?.val || 0;
          return `${energyType}${energyCost}${mod.tag}`;
        }
      })
      .join(',');
  return generatePermutationsOfFive(mods, createPermutationKey);
}
