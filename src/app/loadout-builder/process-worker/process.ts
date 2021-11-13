import { StatHashes } from 'app/../data/d2/generated-enums';
import { activityModPlugCategoryHashes } from 'app/loadout/mod-utils';
import _ from 'lodash';
import { knownModPlugCategoryHashes } from '../../loadout/known-values';
import { armor2PlugCategoryHashesByName, TOTAL_STAT_HASH } from '../../search/d2-known-values';
import { chainComparator, Comparator, compareBy, reverseComparator } from '../../utils/comparators';
import { infoLog } from '../../utils/log';
import {
  ArmorStatHashes,
  ArmorStats,
  LockableBucketHashes,
  LockableBuckets,
  StatFilters,
  StatRanges,
} from '../types';
import { statTier } from '../utils';
import {
  canTakeSlotIndependentMods,
  generateProcessModPermutations,
  sortProcessModsOrItems,
} from './process-utils';
import { SetTracker } from './set-tracker';
import {
  IntermediateProcessArmorSet,
  LockedProcessMods,
  ProcessArmorSet,
  ProcessItem,
  ProcessItemsByBucket,
  ProcessMod,
} from './types';

/** Caps the maximum number of total armor sets that'll be returned */
const RETURNED_ARMOR_SETS = 200;

/**
 * Generate a comparator that sorts first by the total of the considered stats,
 * and then by the individual stats in the order we want. This includes the effects
 * of existing masterwork mods and the upgradeSpendTier
 */
function compareByStatOrder(
  items: ProcessItem[],
  // Ordered list of enabled stats
  orderedConsideredStatHashes: number[],
  // The user's chosen order of all stats, by hash
  statOrder: number[],
  // A map from item to stat values in user-selected order, with masterworks included
  statsCache: Map<ProcessItem, number[]>
) {
  const statHashToOrder: { [statHash: number]: number } = {};
  statOrder.forEach((statHash, index) => (statHashToOrder[statHash] = index));

  // Calculate the min and max of both the total considered stat and the sum of squares of considered stats so we can
  // come up with a normalized score.
  const minMax = {
    min: { squares: Number.MAX_VALUE, total: Number.MAX_VALUE },
    max: { squares: Number.MIN_VALUE, total: Number.MIN_VALUE },
  };

  for (const item of items) {
    let total = 0;
    let squares = 0;
    const stats = statsCache.get(item)!;
    for (const statHash of orderedConsideredStatHashes) {
      const value = stats[statHashToOrder[statHash]];
      total += value;
      squares += value * value;
    }
    minMax.min.squares = Math.min(minMax.min.squares, squares);
    minMax.max.squares = Math.max(minMax.max.squares, squares);
    minMax.min.total = Math.min(minMax.min.total, total);
    minMax.max.total = Math.max(minMax.max.total, total);
  }

  // This is based on the idea that items that have high total in the considered stats are good, but pieces
  // that have high individual values in some of the stats might also be really useful.
  const totalScore = (item: ProcessItem) => {
    let total = 0;
    let squares = 0;
    const stats = statsCache.get(item)!;
    for (const statHash of orderedConsideredStatHashes) {
      const value = stats[statHashToOrder[statHash]];
      total += value;
      squares += value * value;
    }

    const normalizedTotal = (total - minMax.min.total) / (minMax.max.total - minMax.min.total);
    const normalizedSquares =
      (squares - minMax.min.squares) / (minMax.max.squares - minMax.min.squares);
    return (normalizedSquares + normalizedTotal) / 2; // average them
  };

  return chainComparator<ProcessItem>(
    // First compare by sum of considered stats
    // This isn't really coupled to showing stat ranges but I'm putting them under the same flag
    $featureFlags.loStatRanges
      ? reverseComparator(compareBy(totalScore))
      : compareBy((i) =>
          _.sumBy(orderedConsideredStatHashes, (h) => -statsCache.get(i)![statHashToOrder[h]])
        ),
    // Then by each stat individually in order
    ...statOrder.map((h) => compareBy((i: ProcessItem) => -statsCache.get(i)![statHashToOrder[h]])),
    // Then by overall total
    compareBy((i) => -i.baseStats[TOTAL_STAT_HASH])
  );
}

/**
 * This processes all permutations of armor to build sets
 * @param filteredItems pared down list of items to process sets from
 * @param modStatTotals Stats that are applied to final stat totals, think general and other mod stats
 */
export function process(
  filteredItems: ProcessItemsByBucket,
  /** Selected mods' total contribution to each stat */
  modStatTotals: ArmorStats,
  /** Mods to add onto the sets */
  lockedModMap: LockedProcessMods,
  /** The user's chosen stat order, including disabled stats */
  statOrder: ArmorStatHashes[],
  // TODO: express stat filter min/max in absolute values!
  statFilters: StatFilters,
  /** Ensure every set includes one exotic */
  anyExotic: boolean,
  /** The maximum number of stat mods to automatically add in to reach our desired stat max. */
  maxStatMods: number,
  onProgress: (remainingTime: number) => void
): {
  sets: ProcessArmorSet[];
  combos: number;
  combosWithoutCaps: number;
  statRanges?: StatRanges;
  statRangesFiltered?: StatRanges;
} {
  const pstart = performance.now();

  // How many "general" mod slots do we have open to apply generic stat mods?
  const generalModsAvailable = Math.min(
    maxStatMods,
    LockableBucketHashes.length -
      (lockedModMap[armor2PlugCategoryHashesByName.general]?.length || 0)
  );

  // TODO: potentially could filter out items that provide more than the maximum of a stat all on their own?

  // Stat types excluding ignored stats
  const orderedConsideredStatHashes = statOrder.filter(
    (statHash) => !statFilters[statHash].ignored
  );

  // This stores the computed min and max value for each stat as we process all sets, so we
  // can display it on the stat filter dropdowns
  const statRanges: StatRanges = _.mapValues(statFilters, () => ({ min: 100, max: 0 }));

  const statRangesFiltered: StatRanges = _.mapValues(statFilters, () => ({
    min: 100,
    max: 0,
  }));

  const statsCache: Map<ProcessItem, number[]> = new Map();

  // TODO: favor already masterworked, more modslots, etc
  // TODO: incorporate mod choices
  const comparatorsByBucket: { [bucketHash: number]: Comparator<ProcessItem> } = {};

  // Precompute the stats of each item in the order the user asked for
  for (const item of [
    ...filteredItems[LockableBuckets.helmet],
    ...filteredItems[LockableBuckets.gauntlets],
    ...filteredItems[LockableBuckets.chest],
    ...filteredItems[LockableBuckets.leg],
    ...filteredItems[LockableBuckets.classitem],
  ]) {
    statsCache.set(item, getStatValuesWithMW(item, statOrder));
  }

  for (const bucket of LockableBucketHashes) {
    const items = filteredItems[bucket];
    comparatorsByBucket[bucket] = compareByStatOrder(
      items,
      orderedConsideredStatHashes,
      statOrder,
      statsCache
    );
  }

  // Sort gear by the chosen stats so we consider the likely-best gear first
  // TODO: make these a list/map
  const helms = filteredItems[LockableBuckets.helmet].sort(
    comparatorsByBucket[LockableBuckets.helmet]
  );
  const gaunts = filteredItems[LockableBuckets.gauntlets].sort(
    comparatorsByBucket[LockableBuckets.gauntlets]
  );
  const chests = filteredItems[LockableBuckets.chest].sort(
    comparatorsByBucket[LockableBuckets.chest]
  );
  const legs = filteredItems[LockableBuckets.leg].sort(comparatorsByBucket[LockableBuckets.leg]);
  // TODO: we used to do these in chunks, where items w/ same stats were considered together. For class items that
  // might still be useful. In practice there are only 1/2 class items you need to care about - all of them that are
  // masterworked and all of them that aren't. I think we may want to go back to grouping like items but we'll need to
  // incorporate modslots and energy maybe.
  const classItems = filteredItems[LockableBuckets.classitem].sort(
    comparatorsByBucket[LockableBuckets.classitem]
  );

  // We won't search through more than this number of stat combos because it takes too long.
  // On my machine (bhollis) it takes ~1s per 270,000 combos
  const combosLimit = 2_000_000;

  // The maximum possible combos we could have
  const combosWithoutCaps =
    helms.length * gaunts.length * chests.length * legs.length * classItems.length;
  const initialNumItems =
    helms.length + gaunts.length + chests.length + legs.length + classItems.length;

  let combos = combosWithoutCaps;

  // If we're over the limit, start trimming down the armor lists starting with the worst among them.
  // Since we're already sorted by total stats descending this should toss the worst items.
  let numDiscarded = 0;
  while (combos > combosLimit) {
    const sortedTypes = [helms, gaunts, chests, legs]
      // Don't ever remove the last item in a category
      .filter((items) => items.length > 1)
      // Sort by our same statOrder-aware comparator, but only compare the worst-ranked item in each category
      .sort((a: ProcessItem[], b: ProcessItem[]) =>
        comparatorsByBucket[a[0].bucketHash](a[a.length - 1], b[b.length - 1])
      );
    // Pop the last item off the worst-sorted list
    sortedTypes[sortedTypes.length - 1].pop();
    numDiscarded++;
    // TODO: A smarter version of this would avoid trimming out items that match mod slots we need, somehow
    combos = helms.length * gaunts.length * chests.length * legs.length * classItems.length;
  }

  if (combos < combosWithoutCaps) {
    infoLog(
      'loadout optimizer',
      'Reduced armor combinations from',
      combosWithoutCaps,
      'to',
      combos,
      'by discarding',
      numDiscarded,
      'of',
      initialNumItems,
      'items'
    );
  }

  if (combos === 0) {
    return { sets: [], combos: 0, combosWithoutCaps: 0 };
  }

  const setTracker = new SetTracker(10_000);

  let generalMods: ProcessMod[] = [];
  let combatMods: ProcessMod[] = [];
  let activityMods: ProcessMod[] = [];

  for (const [plugCategoryHash, mods] of Object.entries(lockedModMap)) {
    const pch = Number(plugCategoryHash);
    if (pch === armor2PlugCategoryHashesByName.general) {
      generalMods = generalMods.concat(mods);
    } else if (activityModPlugCategoryHashes.includes(pch)) {
      activityMods = activityMods.concat(mods);
    } else if (!knownModPlugCategoryHashes.includes(pch)) {
      combatMods = combatMods.concat(mods);
    }
  }

  const generalModsPermutations = generateProcessModPermutations(
    generalMods.sort(sortProcessModsOrItems)
  );
  const combatModPermutations = generateProcessModPermutations(
    combatMods.sort(sortProcessModsOrItems)
  );
  const activityModPermutations = generateProcessModPermutations(
    activityMods.sort(sortProcessModsOrItems)
  );
  const hasMods = combatMods.length || activityMods.length || generalMods.length;

  let numSkippedLowTier = 0;
  let numStatRangeExceeded = 0;
  let numCantSlotMods = 0;
  let numInserted = 0;
  let numRejectedAfterInsert = 0;
  let numDoubleExotic = 0;
  let numNoExotic = 0;

  // TODO: is there a more efficient iteration order through the sorted items that'd let us quit early? Something that could generate combinations

  let numProcessed = 0;
  let elapsedSeconds = 0;
  for (const helm of helms) {
    for (const gaunt of gaunts) {
      // For each additional piece, skip the whole branch if we've managed to get 2 exotics
      if (gaunt.equippingLabel && gaunt.equippingLabel === helm.equippingLabel) {
        numDoubleExotic += chests.length * legs.length * classItems.length;
        continue;
      }
      for (const chest of chests) {
        if (
          chest.equippingLabel &&
          (chest.equippingLabel === gaunt.equippingLabel ||
            chest.equippingLabel === helm.equippingLabel)
        ) {
          numDoubleExotic += legs.length * classItems.length;
          continue;
        }
        for (const leg of legs) {
          if (
            leg.equippingLabel &&
            (leg.equippingLabel === chest.equippingLabel ||
              leg.equippingLabel === gaunt.equippingLabel ||
              leg.equippingLabel === helm.equippingLabel)
          ) {
            numDoubleExotic += classItems.length;
            continue;
          }

          if (
            anyExotic &&
            !helm.equippingLabel &&
            !gaunt.equippingLabel &&
            !chest.equippingLabel &&
            !leg.equippingLabel
          ) {
            numNoExotic += classItems.length;
            continue;
          }

          for (const classItem of classItems) {
            numProcessed++;
            const armor = [helm, gaunt, chest, leg, classItem];

            // TODO: why not just another ordered list?
            // Start with the contribution of mods. Spread operator is slow.
            // Also dynamic property syntax is slow which is why we use the raw hashes here.
            const stats: ArmorStats = {
              2996146975: modStatTotals[2996146975], // Stat "Mobility"
              392767087: modStatTotals[392767087], // Stat "Resilience"
              1943323491: modStatTotals[1943323491], // Stat "Recovery"
              1735777505: modStatTotals[1735777505], // Stat "Discipline"
              144602215: modStatTotals[144602215], // Stat "Intellect"
              4244567218: modStatTotals[4244567218], // Stat "Strength"
            };
            const energyRemaining = [0, 0, 0, 0, 0];
            let armorIndex = 0;
            for (const item of armor) {
              const itemStats = statsCache.get(item)!;
              let index = 0;
              // itemStats are already in the user's chosen stat order
              for (const statHash of statOrder) {
                stats[statHash] = stats[statHash] + itemStats[index];
                // Stats can't exceed 100 even with mods. At least, today they
                // can't - we *could* pass the max value in from the stat def.
                // Math.min is slow.
                if (stats[statHash] > 100) {
                  stats[statHash] = 100;
                }
                index++;
              }
              energyRemaining[armorIndex] = item.energy
                ? item.energy.capacity - item.energy.val
                : 0;
              armorIndex++;
            }

            // Check stat tiers
            let totalTier = 0;
            let statRangeExceeded = false;
            const statMods: number[] = [];
            for (const statHash of statOrder) {
              let value = stats[statHash];
              let tier = statTier(value);

              const filter = statFilters[statHash];
              if (!filter.ignored) {
                if (tier > filter.max) {
                  statRangeExceeded = true;
                } else {
                  // Automatically add stat mods to taste
                  if (generalModsAvailable - statMods.length > 0) {
                    const newValue = addStatMods(
                      statHash,
                      generalModsAvailable,
                      value,
                      filter.max,
                      energyRemaining,
                      statMods
                    );
                    value = newValue;
                    stats[statHash] = value;
                  }

                  tier = statTier(value);

                  if (tier < filter.min) {
                    statRangeExceeded = true;
                  }
                }

                // Update our global min/max for this stat
                const range = statRanges[statHash];
                if (value > range.max) {
                  range.max = value;
                }
                if (value < range.min) {
                  range.min = value;
                }
                totalTier += tier;
              }
            }

            if (statRangeExceeded) {
              numStatRangeExceeded++;
              continue;
            }

            // Drop this set if it could never make it
            if (!setTracker.couldInsert(totalTier)) {
              numSkippedLowTier++;
              continue;
            }

            // For armour 2 mods we ignore slot specific mods as we prefilter items based on energy requirements
            if (
              hasMods &&
              !canTakeSlotIndependentMods(
                generalModsPermutations,
                combatModPermutations,
                activityModPermutations,
                armor
              )
            ) {
              numCantSlotMods++;
              continue;
            }

            const newArmorSet: IntermediateProcessArmorSet = {
              armor,
              stats,
              statMods,
            };

            // Calculate the "tiers string" here, since most sets don't make it this far
            // A string version of the tier-level of each stat, must be lexically comparable
            let tiers = '';
            for (const statHash of statOrder) {
              const value = stats[statHash];
              const tier = statTier(value);
              // Make each stat exactly one code unit so the string compares correctly
              const filter = statFilters[statHash];
              if (!filter.ignored) {
                tiers += tier.toString(11);
              }

              // Separately track the stat ranges of sets that made it through all our filters
              const range = statRangesFiltered[statHash];
              if (value > range.max) {
                range.max = value;
              }
              if (value < range.min) {
                range.min = value;
              }
            }

            numInserted++;
            if (!setTracker.insert(totalTier, tiers, newArmorSet)) {
              numRejectedAfterInsert++;
            }
          }

          // Report speed
          const totalTime = performance.now() - pstart;
          const newElapsedSeconds = Math.floor(totalTime / 500);

          if (newElapsedSeconds > elapsedSeconds) {
            elapsedSeconds = newElapsedSeconds;
            const speed = (numProcessed * 1000) / totalTime;
            const remaining = Math.round((combos - numProcessed) / speed);
            onProgress(remaining);
          }
        }
      }
    }
  }

  const finalSets = setTracker.getArmorSets();

  const totalTime = performance.now() - pstart;
  infoLog(
    'loadout optimizer',
    'found',
    finalSets.length,
    'stat mixes after processing',
    combos,
    'stat combinations in',
    totalTime,
    'ms - ',
    Math.floor((combos * 1000) / totalTime),
    'combos/s',
    // Split into two objects so console.log will show them all expanded
    {
      numCantSlotMods,
      numSkippedLowTier,
      numStatRangeExceeded,
    },
    {
      numInserted,
      numRejectedAfterInsert,
      numDoubleExotic,
      numNoExotic,
    }
  );

  return {
    sets: flattenSets(_.take(finalSets, RETURNED_ARMOR_SETS)),
    combos,
    combosWithoutCaps,
    statRanges,
    statRangesFiltered,
  };
}

/**
 * Gets the stat values of an item with masterwork.
 */
function getStatValuesWithMW(item: ProcessItem, orderedStatValues: number[]) {
  const baseStats = { ...item.baseStats };

  if (item.energy?.capacity === 10) {
    for (const statHash of orderedStatValues) {
      baseStats[statHash] += 2;
    }
  }
  // mapping out from stat values to ensure ordering and that values don't fall below 0 from locked mods
  return orderedStatValues.map((statHash) => Math.max(baseStats[statHash], 0));
}

function flattenSets(sets: IntermediateProcessArmorSet[]): ProcessArmorSet[] {
  return sets.map((set) => ({
    ...set,
    armor: set.armor.map((item) => item.id),
  }));
}

// TODO: it'd be nice to make this dynamic but it's a pain to pump definitions in here.

// Regular stat mods add 10
const largeStatMods: { [statHash: number]: { hash: number; cost: number } } = {
  [StatHashes.Mobility]: { hash: 3961599962, cost: 3 },
  [StatHashes.Resilience]: { hash: 2850583378, cost: 3 },
  [StatHashes.Recovery]: { hash: 2645858828, cost: 4 },
  [StatHashes.Discipline]: { hash: 4048838440, cost: 3 },
  [StatHashes.Intellect]: { hash: 3355995799, cost: 5 },
  [StatHashes.Strength]: { hash: 3253038666, cost: 3 },
};

// Minor stat mods add 5
const minorStatMods: { [statHash: number]: { hash: number; cost: number } } = {
  [StatHashes.Mobility]: { hash: 204137529, cost: 1 },
  [StatHashes.Resilience]: { hash: 3682186345, cost: 1 },
  [StatHashes.Recovery]: { hash: 555005975, cost: 2 },
  [StatHashes.Discipline]: { hash: 2623485440, cost: 1 },
  [StatHashes.Intellect]: { hash: 1227870362, cost: 2 },
  [StatHashes.Strength]: { hash: 3699676109, cost: 1 },
};

/**
 * Assign general stat mods in order to bring the stat value up to the desired max tier.
 */
// TODO: maybe post-processing add in the actual stat mods??
// TODO: maybe nice to use an integer constraint solver here instead of greedily filling mods?
function addStatMods(
  statHash: number,
  // The maximum total number of mods we could use
  generalModsAvailable: number,
  value: number,
  maxTier: number,
  energyRemaining: number[], // indexed by armor slot, modified in this function
  statMods: number[] // modified in this function
): number {
  const maxStat = maxTier * 10;
  let maxRemainingEnergyIndex = 0;
  let maxRemaining = 0;
  for (let i = 0; i < 5; i++) {
    const remaining = energyRemaining[i];
    if (remaining > maxRemaining) {
      maxRemainingEnergyIndex = i;
      maxRemaining = remaining;
    }
  }

  const largeMod = largeStatMods[statHash];
  const minorMod = minorStatMods[statHash];

  while (
    value < maxStat &&
    energyRemaining[maxRemainingEnergyIndex] > 0 &&
    generalModsAvailable - statMods.length > 0
  ) {
    if (maxStat - value <= 5 || energyRemaining[maxRemainingEnergyIndex] < largeMod.cost) {
      value += 5;
      energyRemaining[maxRemainingEnergyIndex] -= minorMod.cost;
      statMods.push(minorMod.hash);
    } else {
      value += 10;
      energyRemaining[maxRemainingEnergyIndex] -= largeMod.cost;
      statMods.push(largeMod.hash);
    }

    let maxRemaining = 0;
    for (let i = 0; i < 5; i++) {
      const remaining = energyRemaining[i];
      if (remaining > maxRemaining) {
        maxRemainingEnergyIndex = i;
        maxRemaining = remaining;
      }
    }
  }
  return value;
}
