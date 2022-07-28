import { StatHashes } from 'app/../data/d2/generated-enums';
import { compareBy } from 'app/utils/comparators';
import { ArmorStatHashes } from '../types';
import { ProcessMod } from './types';

// Regular stat mods add 10
const largeStatMods: { [statHash in ArmorStatHashes]: { hash: number; cost: number } } = {
  [StatHashes.Mobility]: { hash: 3961599962, cost: 3 },
  [StatHashes.Resilience]: { hash: 2850583378, cost: 3 },
  [StatHashes.Recovery]: { hash: 2645858828, cost: 4 },
  [StatHashes.Discipline]: { hash: 4048838440, cost: 3 },
  [StatHashes.Intellect]: { hash: 3355995799, cost: 5 },
  [StatHashes.Strength]: { hash: 3253038666, cost: 3 },
};

// Minor stat mods add 5
const minorStatMods: { [statHash in ArmorStatHashes]: { hash: number; cost: number } } = {
  [StatHashes.Mobility]: { hash: 204137529, cost: 1 },
  [StatHashes.Resilience]: { hash: 3682186345, cost: 1 },
  [StatHashes.Recovery]: { hash: 555005975, cost: 2 },
  [StatHashes.Discipline]: { hash: 2623485440, cost: 1 },
  [StatHashes.Intellect]: { hash: 1227870362, cost: 2 },
  [StatHashes.Strength]: { hash: 3699676109, cost: 1 },
};

// If we can split an intellect mod (5 cost into 2, 2 cost), then we don't need to bother with
// splitting a recovery mod (4 cost into 2, 2 cost) in the same stage because the intellect mod leaves
// us in a better situation. Similarly, it's unimportant if we split a mobility mod or a resilience mod,
// the effect is the same.
const ignoreSplittingRelations: { [statHash in ArmorStatHashes]: ArmorStatHashes[] } = {
  [StatHashes.Mobility]: [
    StatHashes.Mobility,
    StatHashes.Resilience,
    StatHashes.Discipline,
    StatHashes.Strength,
  ],
  [StatHashes.Resilience]: [
    StatHashes.Mobility,
    StatHashes.Resilience,
    StatHashes.Discipline,
    StatHashes.Strength,
  ],
  [StatHashes.Recovery]: [StatHashes.Recovery],
  [StatHashes.Discipline]: [
    StatHashes.Mobility,
    StatHashes.Resilience,
    StatHashes.Discipline,
    StatHashes.Strength,
  ],
  [StatHashes.Intellect]: [StatHashes.Recovery, StatHashes.Intellect],
  [StatHashes.Strength]: [
    StatHashes.Mobility,
    StatHashes.Resilience,
    StatHashes.Discipline,
    StatHashes.Strength,
  ],
};

export interface ModsPick {
  costs: number[];
  modHashes: number[];
}

type ModsWorkingSet = {
  largeMods: { hash: number; cost: number; statHash: ArmorStatHashes }[];
  smallMods: { hash: number; cost: number }[];
};

export interface GeneralModsCache {
  generalModCosts: number[];
  statOrder: ArmorStatHashes[];
  autoStatMods: boolean;
  cache: { [statsString: string]: ModsPick[] };
}
/**
 * Okay, so LO should automatically assign stat mods to hit minimum required stats.
 * Auto mod assignment *must be* correct: If there is a way to pick stat mods and assign
 * other mods and stat mods so that they fit on the items and the minimum stats are hit,
 * LO must be able to find it. This is surprisingly tricky: Imagine we need one tier of
 * strength and one tier of recovery. We could pick the mods in different ways:
 *
 * * [large recovery (4), large strength (3)]
 * * [large recovery (4), small strength (1), small strength (1)]
 * * [large strength (3), small recovery (2), small recovery (2)]
 * * [small recovery (2), small recovery (2), small strength (1), small strength (1)]
 *
 * Each of these picks is pareto-optimal wrt. leftover energy. There exist armor + mod
 * picks for which exactly one of these picks fits and no other pick can fit.
 * This becomes even worse when LO has to assign bucket-independent mods like combat or
 * activity mods, because there might be a permutation of BI mods that doesn't
 * leave enough space for any of these picks and another permutation that does.
 *
 * What saves us here is that stat mods don't have an element or mod slot requirement, so we
 * don't have to test all permutations of stat mods. Instead, we just sort the costs of each pick
 * descending and compare with the leftover energy capacities, also sorced descendingly.
 *
 * When LO determines that a set is missing some stats, it asks this cache for picks of mods that
 * generate these stats. `getViableAutoModPicks` builds a list of possible picks.
 * LO can then test these picks for every BI assignment it comes up with.
 *
 * Finally, what's perhaps interesting about this is that this already factors in stat mods the
 * user picked themselves, but without the stats (because those are factored in externally in the base stats).
 * E.g. if the user forces an intellect mod (cost 5), `getViableAutoModPicks` will only generate picks with up
 * to 4 extra mods, and the costs of every pick will include a 5 at the front. LO thus doesn't need to
 * iterate over stat mod permutations and gets the check for free.
 */
export function createGeneralModsCache(
  generalMods: ProcessMod[],
  statOrder: ArmorStatHashes[],
  autoStatMods: boolean
): GeneralModsCache {
  return {
    generalModCosts: generalMods.map((mod) => mod.energy?.val || 0),
    statOrder,
    autoStatMods,
    cache: {},
  };
}

export function getViableGeneralModPicks(
  cache: GeneralModsCache,
  neededStats: number[]
): ModsPick[] {
  if (!cache.autoStatMods) {
    return [{ costs: cache.generalModCosts, modHashes: [] }];
  }
  // Divide by 5 and round up to the nearest integer, such that
  // if we need [0]->0, [1,5] -> 1, [6-10] -> 2, [11-15] -> 3, ...
  neededStats = neededStats.map((x) => Math.ceil(x / 5));
  const statsString = 'stats-' + neededStats.map((x) => x.toString(16)).join('');
  if (cache[statsString]) {
    return cache[statsString];
  }

  const startingMods: ModsWorkingSet = { largeMods: [], smallMods: [] };

  neededStats.reduce((acc, neededValue, index) => {
    const statHash = cache.statOrder[index];
    if ((neededValue & 1) !== 0) {
      acc.smallMods.push({ ...minorStatMods[statHash] });
      neededValue -= 1;
    }
    while (neededValue > 0) {
      acc.largeMods.push({ ...largeStatMods[statHash], statHash });
      neededValue -= 2;
    }
    return acc;
  }, startingMods);
  // Sort large mods ascending so that we split an intellect mod first -- that's important
  // for our efficient splitting algorithm below to be correct
  startingMods.largeMods.sort(compareBy(({ cost }) => cost));

  const remainingAssignmentSlots = 5 - cache.generalModCosts.length;
  const unusedModSlots =
    remainingAssignmentSlots - startingMods.largeMods.length - startingMods.smallMods.length;

  // We now have the smallest number of mods that can help us hit our target stats.
  // If this is already too many mods, we have to stop.
  if (unusedModSlots < 0) {
    cache[statsString] = [];
    return [];
  }

  const options =
    unusedModSlots !== 0 && startingMods.largeMods.length > 0
      ? [startingMods, ...splitMods(startingMods, unusedModSlots, startingMods.largeMods.length)]
      : [startingMods];
  const picks = finalize(cache, options);
  cache[statsString] = picks;
  return picks;
}

function finalize(cache: GeneralModsCache, sets: ModsWorkingSet[]): ModsPick[] {
  const picks: ModsPick[] = [];
  for (const set of sets) {
    const setCosts = set.largeMods
      .map(({ cost }) => cost)
      .concat(set.smallMods.map(({ cost }) => cost));
    const modHashes = set.largeMods
      .map(({ hash }) => hash)
      .concat(set.smallMods.map(({ hash }) => hash));
    const costsTogether = cache.generalModCosts.concat(setCosts);
    // Sort costs descending
    costsTogether.sort(compareBy((x) => -x));
    picks.push({
      modHashes,
      costs: costsTogether,
    });
  }
  return picks;
}

/**
 * Recursively derives variants of a pick of mods by splitting large mods into small mods.
 * Here's an example (large mods first, small mods second, `|` denotes the hiWatermark):
 * ```
 * [RES+10 REC+10 INT+10], []
 *     [RES+10 REC+10 |], [INT+5 INT+5]
 *         [RES+10 |], [INT+5 INT+5 REC+5 REC+5]
 *         [| REC+10], [INT+5 INT+5 RES+5 RES+5]
 *     [| REC+10 INT+10], [RES+5 RES+5]
 *
 * ```
 *
 * So we generate 5 different picks. What's noticeable is that we don't generate a
 * [RES+10 INT+10], [REC+5 REC+5] pick because that's strictly worse than the split intellect mod.
 * The use of the hiWatermark ensures we don't end up causing duplicate picks in our recursive expansion.
 */
function splitMods(
  workingSet: ModsWorkingSet,
  unusedModSlots: number,
  hiWatermark: number
): ModsWorkingSet[] {
  const recurse = unusedModSlots > 1;
  const bannedSplitStatHashes: ArmorStatHashes[] = [];
  const returnVal: ModsWorkingSet[] = [];

  for (let idx = hiWatermark - 1; idx >= 0; idx--) {
    // In an earlier iteration, we performed an at least equivalently favorable
    // split, so ignore this split for now.
    if (bannedSplitStatHashes.includes(workingSet.largeMods[idx].statHash)) {
      continue;
    }

    // Split the mod at idx
    const splitSet = {
      largeMods: workingSet.largeMods.slice(),
      smallMods: workingSet.smallMods.slice(),
    };
    const modStatHash = splitSet.largeMods[idx].statHash;
    const smallMod = minorStatMods[modStatHash];
    // Remove it from the large mods set and add the small variant twice
    splitSet.largeMods.splice(idx, 1);
    splitSet.smallMods.push(smallMod, smallMod);
    // Don't split a mod with the same or worse energy effects in this loop later
    bannedSplitStatHashes.push(...ignoreSplittingRelations[modStatHash]);
    returnVal.push(splitSet);
    // and if we have another free slot even after splitting, split further mods
    // at lower positions than the one we already split (see function comments,
    // this ensures we don't end up producing equivalent picks)
    if (recurse) {
      returnVal.push(...splitMods(splitSet, unusedModSlots - 1, idx));
    }
  }

  return returnVal;
}
