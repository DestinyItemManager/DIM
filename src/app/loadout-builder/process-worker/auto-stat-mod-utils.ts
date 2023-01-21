import { StatHashes } from 'app/../data/d2/generated-enums';
import { compareBy } from 'app/utils/comparators';
import { ArmorStatHashes } from '../types';

// Regular stat mods add 10
// NB includes the stat hash again to avoid creating new objects in the temporary ModsWorkingSet
const largeStatMods: {
  [statHash in ArmorStatHashes]: { hash: number; cost: number; statHash: ArmorStatHashes };
} = {
  [StatHashes.Mobility]: { hash: 3961599962, cost: 3, statHash: StatHashes.Mobility },
  [StatHashes.Resilience]: { hash: 2850583378, cost: 4, statHash: StatHashes.Resilience },
  [StatHashes.Recovery]: { hash: 2645858828, cost: 4, statHash: StatHashes.Recovery },
  [StatHashes.Discipline]: { hash: 4048838440, cost: 3, statHash: StatHashes.Discipline },
  [StatHashes.Intellect]: { hash: 3355995799, cost: 4, statHash: StatHashes.Intellect },
  [StatHashes.Strength]: { hash: 3253038666, cost: 3, statHash: StatHashes.Strength },
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

/*
// Artifice mods add 3
const artificeStatMods: { [statHash in ArmorStatHashes]: { hash: number } } = {
  [StatHashes.Mobility]: { hash: 11111111 },
  [StatHashes.Resilience]: { hash: 22222222 },
  [StatHashes.Recovery]: { hash: 33333333 },
  [StatHashes.Discipline]: { hash: 44444444 },
  [StatHashes.Intellect]: { hash: 55555555 },
  [StatHashes.Strength]: { hash: 66666666 },
};
*/

export interface ModsPickV2 {
  numArtificeMods: number;
  numGeneralMods: number;
  generalModsCosts: number[];
  modHashes: number[];
}

export interface CacheForStat {
  statHash: number;
  waysToGetThisStat: {
    [targetStat: number]: ModsPickV2[] | undefined;
  };
}

export interface CacheV2 {
  statCaches: { [statHash in ArmorStatHashes]: CacheForStat };
}

function buildCacheForStat(statHash: ArmorStatHashes, autoStatMods: boolean) {
  const cache: CacheForStat = { statHash, waysToGetThisStat: {} };
  // const artificeMod = artificeStatMods[statHash];
  const minorMod = minorStatMods[statHash];
  const majorMod = largeStatMods[statHash];

  for (let numArtificeMods = 0; numArtificeMods <= 5; numArtificeMods++) {
    for (let numMinorMods = 0; numMinorMods <= (autoStatMods ? 5 : 0); numMinorMods++) {
      for (
        let numMajorMods = 0;
        numMajorMods <= (autoStatMods ? 5 - numMinorMods : 0);
        numMajorMods++
      ) {
        const statValue = numArtificeMods * 3 + numMinorMods * 5 + numMajorMods * 10;
        if (statValue === 0) {
          continue;
        }
        const lowerRange = numArtificeMods > 0 ? 2 : 4;
        const obj: ModsPickV2 = {
          numArtificeMods,
          numGeneralMods: numMinorMods + numMajorMods,
          generalModsCosts: [
            ...Array(numMajorMods).fill(majorMod.cost),
            ...Array(numMinorMods).fill(minorMod.cost),
          ],
          modHashes: [
            ...Array(numMajorMods).fill(majorMod.hash),
            ...Array(numMinorMods).fill(minorMod.hash),
            // ...Array(numArtificeMods).fill(artificeMod.hash),
          ],
        };
        for (
          let achievableValue = statValue - lowerRange;
          achievableValue <= statValue;
          achievableValue++
        ) {
          (cache.waysToGetThisStat[achievableValue] ??= []).push(obj);
        }
      }
    }
  }

  for (const pickArray of Object.values(cache.waysToGetThisStat)) {
    pickArray!.sort(compareBy((pick) => -pick.numArtificeMods));
  }

  return cache;
}

export function buildCacheV2(autoStatMods: boolean): CacheV2 {
  return {
    statCaches: {
      [StatHashes.Mobility]: buildCacheForStat(StatHashes.Mobility, autoStatMods),
      [StatHashes.Resilience]: buildCacheForStat(StatHashes.Resilience, autoStatMods),
      [StatHashes.Recovery]: buildCacheForStat(StatHashes.Recovery, autoStatMods),
      [StatHashes.Discipline]: buildCacheForStat(StatHashes.Discipline, autoStatMods),
      [StatHashes.Intellect]: buildCacheForStat(StatHashes.Intellect, autoStatMods),
      [StatHashes.Strength]: buildCacheForStat(StatHashes.Strength, autoStatMods),
    },
  };
}
