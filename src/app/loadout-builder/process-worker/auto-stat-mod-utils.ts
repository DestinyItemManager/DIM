import { armorStats } from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { ArmorStatHashes } from '../types';
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
  generalModsCosts: number[];
  /** General + artifice mod hashes */
  modHashes: number[];
  /** Sum of generalModCosts */
  modEnergyCost: number;
}

/**
 * Precalculated ways of hitting all possible stat values for a single stat.
 */
interface CacheForStat {
  statMap: {
    [targetStat: number]: ModsPick[] | undefined;
  };
}

/**
 * Precalculated ways of hitting stat values, separated by stat hash.
 */
export interface AutoModsMap {
  statCaches: { [statHash in ArmorStatHashes]: CacheForStat };
  /**
   * A list of stats where the mods are better or equal than the mods for `statHash`,
   * better defined as "not more expensive".
   */
  cheaperStatsPerStat: { [statHash in ArmorStatHashes]: ArmorStatHashes[] };
}

/**
 * Pick auto mods (general mods and artifice mods)
 * that satisfy the given `neededStats` in `statOrder`.
 */
export function chooseAutoMods(
  info: LoSessionInfo,
  neededStats: number[],
  numArtificeMods: number,
  remainingEnergyCapacities: number[][],
  remainingTotalEnergy: number
) {
  return recursivelyChooseMods(
    info,
    neededStats,
    0,
    info.numAvailableGeneralMods,
    numArtificeMods,
    remainingEnergyCapacities,
    remainingTotalEnergy,
    []
  );
}

function doGeneralModsFit(
  info: LoSessionInfo,
  /** variants of remaining energy capacities given our activity mod assignment, each sorted descending */
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
  info: LoSessionInfo,
  neededStats: number[],
  statIndex: number,
  remainingGeneralSlots: number,
  remainingArtificeSlots: number,
  /** variants of remaining energy capacities given our activity mod assignment, each sorted descending */
  remainingEnergyCapacities: number[][],
  remainingTotalEnergy: number,
  pickedMods: ModsPick[]
): ModsPick[] | undefined {
  while (statIndex < info.statOrder.length && neededStats[statIndex] === 0) {
    statIndex++;
  }

  if (statIndex === info.statOrder.length) {
    // We've hit the end of our needed stats, check if this is possible
    if (doGeneralModsFit(info, remainingEnergyCapacities, pickedMods)) {
      return pickedMods;
    } else {
      return undefined;
    }
  }

  const possiblePicks =
    info.autoModOptions.statCaches[info.statOrder[statIndex]].statMap[neededStats[statIndex]];
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
function buildCacheForStat(
  autoModOptions: AutoModData,
  statHash: ArmorStatHashes,
  availableGeneralStatMods: number
) {
  const cache: CacheForStat = { statMap: {} };
  // Note: All of these could be undefined for whatever reason.
  // In that case, the loop bounds are 0 <= numMods <= 0.
  // Major and minor mod always exist together or not at all.
  const artificeMod = autoModOptions.artificeMods[statHash];
  const minorMod = autoModOptions.generalMods[statHash]?.minorMod;
  const majorMod = autoModOptions.generalMods[statHash]?.majorMod;

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
        const statValue = numArtificeMods * 3 + numMinorMods * 5 + numMajorMods * 10;
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
        const lowerRange = statValue - (numArtificeMods > 0 ? 2 : 4);
        const obj: ModsPick = {
          numArtificeMods,
          numGeneralMods: numMinorMods + numMajorMods,
          generalModsCosts: [
            ...Array(numMajorMods).fill(majorMod?.cost),
            ...Array(numMinorMods).fill(minorMod?.cost),
          ],
          modHashes: [
            ...Array(numMajorMods).fill(majorMod?.hash),
            ...Array(numMinorMods).fill(minorMod?.hash),
            ...Array(numArtificeMods).fill(artificeMod?.hash),
          ],
          modEnergyCost:
            numMinorMods * (minorMod?.cost || 0) + numMajorMods * (majorMod?.cost || 0),
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

function buildLessCostlyRelations(autoModOptions: AutoModData, availableGeneralStatMods: number) {
  return Object.fromEntries(
    armorStats.map((armorStat1) => {
      const hashes: ArmorStatHashes[] = [];
      for (const armorStat2 of armorStats) {
        if (availableGeneralStatMods === 0) {
          // No general mods means it doesn't matter how much our general mods actually cost
          hashes.push(armorStat2);
        } else {
          const mods1 = autoModOptions.generalMods[armorStat1];
          const mods2 = autoModOptions.generalMods[armorStat2];

          if (autoModOptions.artificeMods[armorStat1] && !autoModOptions.artificeMods[armorStat2]) {
            // Stat1 has artifice mods, Stat2 doesn't, so Stat2 is worse in that aspect
          } else if (!mods1) {
            // Stat1 has no mods, so Stat2 can always do equal or better
            hashes.push(armorStat2);
          } else if (!mods2) {
            // Stat1 has mods, Stat2 doesn't, so Stat2 is worse in that aspect
          } else {
            const [large1Cost, large2Cost] = [mods1.majorMod.cost, mods2.majorMod.cost];
            const [small1Cost, small2Cost] = [mods1.minorMod.cost, mods2.minorMod.cost];
            // mods for armorStat2 are cheaper (dominate armorStat1) if
            // they're cheaper or same
            if (small1Cost >= small2Cost && large1Cost >= large2Cost) {
              hashes.push(armorStat2);
            }
          }
        }
      }

      return [armorStat1, hashes];
    })
  ) as AutoModsMap['cheaperStatsPerStat'];
}

export function buildAutoModsMap(
  autoModOptions: AutoModData,
  availableGeneralStatMods: number
): AutoModsMap {
  return {
    statCaches: Object.fromEntries(
      armorStats.map((statHash) => [
        statHash,
        buildCacheForStat(autoModOptions, statHash, availableGeneralStatMods),
      ])
    ) as AutoModsMap['statCaches'],
    cheaperStatsPerStat: buildLessCostlyRelations(autoModOptions, availableGeneralStatMods),
  };
}
