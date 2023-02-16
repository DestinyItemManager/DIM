import { armorStats } from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { StatHashes } from 'data/d2/generated-enums';
import { ArmorStatHashes } from '../types';
import { PrecalculatedInfo } from './process-utils';
import { ProcessItem } from './types';

// Regular stat mods add 10
const largeStatMods: {
  [statHash in ArmorStatHashes]: { hash: number; cost: number };
} = {
  [StatHashes.Mobility]: { hash: 3961599962, cost: 3 },
  [StatHashes.Resilience]: { hash: 2850583378, cost: 4 },
  [StatHashes.Recovery]: { hash: 2645858828, cost: 4 },
  [StatHashes.Discipline]: { hash: 4048838440, cost: 3 },
  [StatHashes.Intellect]: { hash: 3355995799, cost: 4 },
  [StatHashes.Strength]: { hash: 3253038666, cost: 3 },
};

// Minor stat mods add 5
const minorStatMods: { [statHash in ArmorStatHashes]: { hash: number; cost: number } } = {
  [StatHashes.Mobility]: { hash: 204137529, cost: 1 },
  [StatHashes.Resilience]: { hash: 3682186345, cost: 2 },
  [StatHashes.Recovery]: { hash: 555005975, cost: 2 },
  [StatHashes.Discipline]: { hash: 2623485440, cost: 1 },
  [StatHashes.Intellect]: { hash: 1227870362, cost: 2 },
  [StatHashes.Strength]: { hash: 3699676109, cost: 1 },
};

// Artifice mods add 3
export const artificeStatMods: { [statHash in ArmorStatHashes]: { hash: number } } = {
  [StatHashes.Mobility]: { hash: 11111111 },
  [StatHashes.Resilience]: { hash: 22222222 },
  [StatHashes.Recovery]: { hash: 33333333 },
  [StatHashes.Discipline]: { hash: 44444444 },
  [StatHashes.Intellect]: { hash: 55555555 },
  [StatHashes.Strength]: { hash: 66666666 },
};

/**
 * A particular way of achieving a target stat value (for a single stat).
 */
export interface ModsPick {
  numArtificeMods: number;
  numGeneralMods: number;
  generalModsCosts: number[];
  modHashes: number[];
  modEnergyCost: number;
}

/**
 * Precalculated ways of hitting all possible stat values for a single stat.
 */
interface CacheForStat {
  statHash: number;
  statMap: {
    [targetStat: number]: ModsPick[] | undefined;
  };
}

/**
 * Precalculated ways of hitting stat values, separated by stat hash.
 */
export interface AutoModsMap {
  statCaches: { [statHash in ArmorStatHashes]: CacheForStat };
}

/**
 * Pick auto mods (general mods and artifice mods)
 * that satisfy the given `neededStats` in `statOrder`.
 */
export function chooseAutoMods(
  info: PrecalculatedInfo,
  items: ProcessItem[],
  neededStats: number[],
  numArtificeMods: number,
  remainingEnergyCapacities: number[][],
  remainingTotalEnergy: number
) {
  return recursivelyChooseMods(
    info,
    items,
    neededStats,
    0,
    info.numAvailableGeneralMods,
    numArtificeMods,
    remainingEnergyCapacities,
    remainingTotalEnergy,
    []
  );
}

function doModsFit(
  info: PrecalculatedInfo,
  /** variants of remaining energy capacities given our activity mod assignment, each sorted descendingly */
  remainingEnergyCapacities: number[][],
  pickedMods: ModsPick[]
) {
  const generalModCosts = [
    ...info.generalModCosts,
    ...pickedMods.flatMap((m) => m.generalModsCosts),
  ];
  generalModCosts.sort((a, b) => b - a);

  return remainingEnergyCapacities.some((capacities) =>
    generalModCosts.every((cost, index) => cost <= capacities[index])
  );
}

/**
 * Find a combination of artifice and general mods that can
 * help hit the `neededStats` starting from `statIndex` by recursively
 * enumerating all combinations.
 * `pickedMods` contains the mods chosen for earlier stats.
 */
function recursivelyChooseMods(
  info: PrecalculatedInfo,
  items: ProcessItem[],
  neededStats: number[],
  statIndex: number,
  remainingGeneralSlots: number,
  remainingArtificeSlots: number,
  /** variants of remaining energy capacities given our activity mod assignment, each sorted descendingly */
  remainingEnergyCapacities: number[][],
  remainingTotalEnergy: number,
  pickedMods: ModsPick[]
): ModsPick[] | undefined {
  while (statIndex < info.statOrder.length && neededStats[statIndex] === 0) {
    statIndex++;
  }

  if (statIndex === info.statOrder.length) {
    // We've hit the end of our needed stats, check if this is possible
    if (doModsFit(info, remainingEnergyCapacities, pickedMods)) {
      return pickedMods;
    } else {
      return undefined;
    }
  }

  const possiblePicks =
    info.cache.statCaches[info.statOrder[statIndex]].statMap[neededStats[statIndex]];
  if (!possiblePicks) {
    // we can't possibly hit our target stats
    return undefined;
  }

  // Create a new array we append the pick for this stat to.
  const subArray = pickedMods.slice();
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
      info,
      items,
      neededStats,
      statIndex + 1,
      remainingGeneralSlots - pick.numGeneralMods,
      remainingArtificeSlots - pick.numArtificeMods,
      remainingEnergyCapacities,
      remainingTotalEnergy - pick.modEnergyCost,
      subArray
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
function buildCacheForStat(statHash: ArmorStatHashes, availableGeneralStatMods: number) {
  const cache: CacheForStat = { statHash, statMap: {} };
  const artificeMod = artificeStatMods[statHash];
  const minorMod = minorStatMods[statHash];
  const majorMod = largeStatMods[statHash];

  for (let numArtificeMods = 0; numArtificeMods <= 5; numArtificeMods++) {
    for (let numMinorMods = 0; numMinorMods <= availableGeneralStatMods; numMinorMods++) {
      for (
        let numMajorMods = 0;
        numMajorMods <= availableGeneralStatMods - numMinorMods;
        numMajorMods++
      ) {
        const statValue = numArtificeMods * 3 + numMinorMods * 5 + numMajorMods * 10;
        if (statValue === 0) {
          continue;
        }
        // We are allowed to provide more stat points than needed -- within reason.
        // If we have a major mod, this satisfies stat needs of 6,7,8,9,10
        // 5 can be satisfied by a strictly better pick that includes only a minor mod.
        // If we have a major mod and an artifice mod, this satisfies 11,12,13.
        // 10 can be satisfied by dropping the artifice mod.
        // So if we have any artifice pieces, we are allowed to overshoot by 2, and if
        // not then we're allowed to overshoot by 4.
        const lowerRange = statValue - (numArtificeMods > 0 ? 2 : 4);
        const obj: ModsPick = {
          numArtificeMods,
          numGeneralMods: numMinorMods + numMajorMods,
          generalModsCosts: [
            ...Array(numMajorMods).fill(majorMod.cost),
            ...Array(numMinorMods).fill(minorMod.cost),
          ],
          modHashes: [
            ...Array(numMajorMods).fill(majorMod.hash),
            ...Array(numMinorMods).fill(minorMod.hash),
            ...Array(numArtificeMods).fill(artificeMod.hash),
          ],
          modEnergyCost: numMinorMods * minorMod.cost + numMajorMods,
        };
        for (let achievableValue = lowerRange; achievableValue <= statValue; achievableValue++) {
          (cache.statMap[achievableValue] ??= []).push(obj);
        }
      }
    }
  }

  for (const pickArray of Object.values(cache.statMap)) {
    pickArray!.sort(compareBy((pick) => -pick.numArtificeMods));
  }

  return cache;
}

export function buildCacheV2(availableGeneralStatMods: number): AutoModsMap {
  return {
    statCaches: Object.fromEntries(
      armorStats.map((statHash) => [
        statHash,
        buildCacheForStat(statHash, availableGeneralStatMods),
      ])
    ) as AutoModsMap['statCaches'],
  };
}
