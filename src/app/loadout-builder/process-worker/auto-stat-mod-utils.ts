import { chainComparator, compareBy } from 'app/utils/comparators';
import { objectValues } from 'app/utils/util-types';
import { ArmorStatHashes, artificeStatBoost, majorStatBoost, minorStatBoost } from '../types';
import { LoSessionInfo } from './process-utils';
import { AutoModData } from './types';

/**
 * A particular way of achieving a target stat value (for a single stat).
 */
export interface ModsPick {
  /** The number of artifice mods this pick contains. */
  numArtificeMods: number;
  /** The number of general mods this pick contains. */
  numGeneralMods: number;
  /** The cost of the general mods this pick contains, sorted descending. */
  // TODO: Could be left out and calculated on-demand from AutoModData.generalMods
  generalModsCosts: number[];
  /** General + artifice mod hashes */
  // TODO: Could be left out and calculated on-demand from AutoModData.generalMods
  modHashes: number[];
  /** Sum of generalModCosts */
  modEnergyCost: number;
  /** Which stat this set of mods targets */
  targetStatIndex: number;
  /** The exact number of points this set of mods provides (if we ask for 1 stat point, an artifice mod might give 3) */
  exactStatPoints: number;
}

/**
 * Precalculated ways of hitting all possible stat boost values for a single stat.
 */
interface CacheForStat {
  [targetStatValue: number]: ModsPick[] | undefined;
}

/**
 * Precalculated ways of hitting stat values, separated by stat hash.
 */
export interface AutoModsMap {
  statCaches: { [targetStatIndex: number]: CacheForStat };
}

/**
 * Pick auto mods (general mods and artifice mods) that provide at least the
 * given `neededStats` in `statOrder`.
 */
// TODO: This will be complicated by tuning mods, maybe?
//
// TODO: In the tierless world, I think we can just greedily pick mods (or use a
// knapsack algorithm/constraint solver) because we don't need to worry about
// stats not counting because they don't hit a tier. And even then we're really
// just talking about whether to slot a +5 or +10 mod into each empty space. In
// fact, we can probably just figure out the maximum number of +5 and +10 mods
// we can slot in anywhere, and then assign those to stats in order of priority.
export function chooseAutoMods(
  info: LoSessionInfo,
  neededStats: number[],
  numArtificeMods: number,
  remainingEnergyCapacities: number[][],
  remainingTotalEnergy: number,
): ModsPick[] | undefined {
  return recursivelyChooseMods(
    info.autoModOptions,
    info.generalModCosts,
    neededStats,
    0,
    info.numAvailableGeneralMods,
    numArtificeMods,
    remainingEnergyCapacities,
    remainingTotalEnergy,
    undefined,
  );
}

/**
 * Given a set of general mods we want to slot, and a list of remaining-energy possibilities,
 * check if the general mods fit into any of the remaining energy possibilities.
 */
function doGeneralModsFit(
  /** The cost of user-picked general mods, sorted descending. */
  generalModCosts: number[],
  /** variants of remaining energy capacities given our activity mod assignment, each sorted descending */
  remainingEnergyCapacities: number[][],
  pickedMods: ModsPick[] | undefined,
) {
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  if (pickedMods !== undefined && pickedMods.length) {
    generalModCosts = generalModCosts.slice();
    // Intentionally open-coded for performance
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < pickedMods.length; i++) {
      generalModCosts.push(...pickedMods[i].generalModsCosts);
    }
    generalModCosts.sort((a, b) => b - a);
  }

  return remainingEnergyCapacities.some((capacities) =>
    generalModCosts.every((cost, index) => cost <= capacities[index]),
  );
}

/**
 * Find a combination of artifice and general mods that can
 * help hit the `neededStats` starting from `statIndex` by recursively
 * enumerating all combinations.
 * `pickedMods` contains the mods chosen for earlier stats.
 */
function recursivelyChooseMods(
  autoModOptions: AutoModsMap,
  /** The cost of user-picked general mods, sorted descending. */
  generalModCosts: number[],
  /** Incremental stat increases we need to hit. */
  neededStats: number[],
  statIndex: number,
  remainingGeneralSlots: number,
  remainingArtificeSlots: number,
  /** variants of remaining energy capacities given our activity mod assignment, each sorted descending */
  remainingEnergyCapacities: number[][],
  remainingTotalEnergy: number,
  pickedMods: ModsPick[] | undefined,
): ModsPick[] | undefined {
  // Skip over stats that we don't need to increase.
  while (statIndex < neededStats.length && neededStats[statIndex] === 0) {
    statIndex++;
  }

  if (statIndex === neededStats.length) {
    // We've hit the end of our needed stats, check if this is possible
    if (doGeneralModsFit(generalModCosts, remainingEnergyCapacities, pickedMods)) {
      return pickedMods ?? [];
    } else {
      return undefined;
    }
  }

  // Get a list of different mod combinations that could hit the needed stat boost for this stat.
  const possiblePicks = autoModOptions.statCaches[statIndex][neededStats[statIndex]];
  if (!possiblePicks) {
    // we can't possibly hit our target stats
    return undefined;
  }

  // Create a new array we append the pick for this stat to.
  const subArray = pickedMods !== undefined ? pickedMods.slice() : [];
  // Dummy value just so we don't repeatedly push and pop.
  subArray.push(subArray[0]);

  for (const pick of possiblePicks) {
    if (
      pick.numArtificeMods > remainingArtificeSlots ||
      pick.numGeneralMods > remainingGeneralSlots ||
      pick.modEnergyCost > remainingTotalEnergy
    ) {
      continue;
    }
    subArray[subArray.length - 1] = pick;
    const solution = recursivelyChooseMods(
      autoModOptions,
      generalModCosts,
      neededStats,
      statIndex + 1,
      remainingGeneralSlots - pick.numGeneralMods,
      remainingArtificeSlots - pick.numArtificeMods,
      remainingEnergyCapacities,
      remainingTotalEnergy - pick.modEnergyCost,
      subArray,
    );
    if (solution) {
      return solution;
    }
  }
}

/**
 * Previously we could use a simple algorithm to come up with all mod combinations to hit certain target stats
 * based on simple "mod splitting": Since minor and major mods give 5 and 10 respectively (common divisor 5),
 * we only needed to care about stat multiples of 5. And we could just start with +10 mods and derive variants by
 * splitting +10 mods into +5 mods. With stats ranging from 0 to 50 (11 values) and 6 stats,
 * this would end up with about 700,000 combinations that could be computed and cached on-demand.
 *
 * However, now we need to take care of the +3 artifice mods, and 3 is coprime with 5 and 10. So first of all,
 * it's a lot more difficult to come up with the pick variants that could hit certain stats, and even if we did,
 * we cannot efficiently cache the results since every single point matters and cache entries for 50^6 values would
 * mean our cache would simply explode. So instead we separate the caches by stat and then piece together the mod
 * picks when actually looking at sets.
 *
 * This unfortunately means a lot of `flatMap`ing down the road and is a lot less efficient. Improvements here
 * could make things a bit faster, especially when they remove equivalent combinations.
 */
function buildCacheForStat(
  autoModOptions: AutoModData,
  statHash: ArmorStatHashes,
  statIndex: number,
  availableGeneralStatMods: number,
) {
  const cache: CacheForStat = {};
  // Note: All of these could be undefined for whatever reason.
  // In that case, the loop bounds are 0 <= numMods <= 0.
  // Major and minor mod always exist together or not at all.
  const artificeMod = autoModOptions.artificeMods[statHash];
  const minorMod = autoModOptions.generalMods[statHash]?.minorMod;
  const majorMod = autoModOptions.generalMods[statHash]?.majorMod;
  // TODO: Pull up the costs here

  for (let numArtificeMods = 0; numArtificeMods <= (artificeMod ? 5 : 0); numArtificeMods++) {
    for (
      let numMinorMods = 0;
      numMinorMods <= (minorMod ? availableGeneralStatMods : 0);
      numMinorMods++
    ) {
      for (
        let numMajorMods = 0;
        numMajorMods <= (majorMod ? availableGeneralStatMods - numMinorMods : 0);
        numMajorMods++
      ) {
        const statValue =
          numArtificeMods * artificeStatBoost +
          numMinorMods * minorStatBoost +
          numMajorMods * majorStatBoost;
        if (statValue === 0) {
          continue;
        }
        // We are allowed to provide more stat points than needed -- within reason.
        // If we have a major mod, this satisfies stat needs of 6,7,8,9,10
        // 5 can be satisfied by a strictly better pick that includes only a minor mod
        // If we have a major mod and an artifice mod, this satisfies 11,12,13.
        // 10 can be satisfied by dropping the artifice mod.
        // So if we have any artifice pieces, we are allowed to overshoot by 2, and if
        // not then we're allowed to overshoot by 4.
        // This ensures pareto-optimality of the various ways of hitting a stat target.
        // Note: Assumptions here are artificeStatBoost < minorStatBoost
        // and majorStatBoost = 2 * minorStatBoost
        const lowerRange =
          statValue - (numArtificeMods > 0 ? artificeStatBoost - 1 : minorStatBoost - 1);
        const obj: ModsPick = {
          numArtificeMods,
          numGeneralMods: numMinorMods + numMajorMods,
          generalModsCosts: [
            ...Array<number>(numMajorMods).fill(majorMod?.cost ?? 0),
            ...Array<number>(numMinorMods).fill(minorMod?.cost ?? 0),
          ],
          modHashes: [
            ...Array<number>(numMajorMods).fill(majorMod?.hash ?? 0),
            ...Array<number>(numMinorMods).fill(minorMod?.hash ?? 0),
            ...Array<number>(numArtificeMods).fill(artificeMod?.hash ?? 0),
          ],
          modEnergyCost:
            numMinorMods * (minorMod?.cost ?? 0) + numMajorMods * (majorMod?.cost ?? 0),
          targetStatIndex: statIndex,
          exactStatPoints: statValue,
        };
        for (let achievableValue = lowerRange; achievableValue <= statValue; achievableValue++) {
          (cache[achievableValue] ??= []).push(obj);
        }
      }
    }
  }

  // Prefer picks that use artifice mods, since they are free.
  for (const pickArray of objectValues(cache)) {
    pickArray!.sort(
      chainComparator(
        compareBy((pick) => -pick.numArtificeMods),
        compareBy((pick) => -pick.numGeneralMods),
      ),
    );
  }

  return cache;
}

export function buildAutoModsMap(
  autoModOptions: AutoModData,
  availableGeneralStatMods: number,
  statOrder: ArmorStatHashes[],
): AutoModsMap {
  return {
    statCaches: Object.fromEntries(
      statOrder.map((statHash, statIndex) => [
        statIndex,
        buildCacheForStat(autoModOptions, statHash, statIndex, availableGeneralStatMods),
      ]),
    ),
  };
}
