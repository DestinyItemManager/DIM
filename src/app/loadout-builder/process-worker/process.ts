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
import {
  canTakeSlotIndependentMods,
  generateProcessModPermutations,
  sortProcessModsOrItems,
} from './process-utils';
import { SetTracker } from './set-tracker';
import {
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
    compareBy((i) => -i.stats[TOTAL_STAT_HASH])
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
  statFilters: StatFilters,
  /** Ensure every set includes one exotic */
  anyExotic: boolean,
  onProgress: (remainingTime: number) => void
): {
  sets: ProcessArmorSet[];
  combos: number;
  combosWithoutCaps: number;
  statRanges?: StatRanges;
  statRangesFiltered?: StatRanges;
} {
  const pstart = performance.now();

  // TODO: potentially could filter out items that provide more than the maximum of a stat all on their own?

  // Stat types excluding ignored stats
  const orderedConsideredStatHashes = statOrder.filter(
    (statHash) => !statFilters[statHash].ignored
  );

  const fixedStatOrder: ArmorStatHashes[] = [
    2996146975, // Stat "Mobility"
    392767087, // Stat "Resilience"
    1943323491, // Stat "Recovery"
    1735777505, // Stat "Discipline"
    144602215, // Stat "Intellect"
    4244567218, // Stat "Strength"
  ];
  const statOrderToFixed = statOrder.map((h) => fixedStatOrder.indexOf(h));

  // This stores the computed min and max value for each stat as we process all sets, so we
  // can display it on the stat filter dropdowns
  const statRanges: StatRanges = _.mapValues(statFilters, () => ({ min: 100, max: 0 }));
  const statRangesFixedOrder = fixedStatOrder.map((h) => statRanges[h]);
  const modStatsFixedOrder = fixedStatOrder.map((h) => modStatTotals[h]);
  const statFiltersFixedOrder = fixedStatOrder.map((h) => statFilters[h]);

  const statRangesFiltered: StatRanges = _.mapValues(statFilters, () => ({
    min: 100,
    max: 0,
  }));
  const statRangesFilteredFixedOrder = fixedStatOrder.map((h) => statRangesFiltered[h]);

  const statsCache: Map<ProcessItem, number[]> = new Map();
  const statsCacheFixedOrder: Map<ProcessItem, number[]> = new Map();

  const comparatorsByBucket: { [bucketHash: number]: Comparator<ProcessItem> } = {};

  // Precompute the stats of each item in the order the user asked for
  for (const item of LockableBucketHashes.flatMap((h) => filteredItems[h])) {
    statsCache.set(
      item,
      statOrder.map((statHash) => Math.max(item.stats[statHash], 0))
    );
    statsCacheFixedOrder.set(
      item,
      fixedStatOrder.map((statHash) => Math.max(item.stats[statHash], 0))
    );
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
  const gauntlets = filteredItems[LockableBuckets.gauntlets].sort(
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

  // The maximum possible combos we could have
  const combosWithoutCaps =
    helms.length * gauntlets.length * chests.length * legs.length * classItems.length;
  const initialNumItems =
    helms.length + gauntlets.length + chests.length + legs.length + classItems.length;

  const combos = combosWithoutCaps;

  const before = {
    helms: helms.length,
    gauntlets: gauntlets.length,
    chests: chests.length,
    legs: legs.length,
    classItems: classItems.length,
  };
  infoLog(
    'loadout optimizer',
    'Processing',
    combosWithoutCaps,
    'combinations from',
    initialNumItems,
    'items',
    before
  );

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
    for (const gaunt of gauntlets) {
      // For each additional piece, skip the whole branch if we've managed to get 2 exotics
      if (gaunt.isExotic && helm.isExotic) {
        numDoubleExotic += chests.length * legs.length * classItems.length;
        continue;
      }
      for (const chest of chests) {
        if (chest.isExotic && (gaunt.isExotic || helm.isExotic)) {
          numDoubleExotic += legs.length * classItems.length;
          continue;
        }
        for (const leg of legs) {
          if (leg.isExotic && (chest.isExotic || gaunt.isExotic || helm.isExotic)) {
            numDoubleExotic += classItems.length;
            continue;
          }

          if (anyExotic && !helm.isExotic && !gaunt.isExotic && !chest.isExotic && !leg.isExotic) {
            numNoExotic += classItems.length;
            continue;
          }

          for (const classItem of classItems) {
            numProcessed++;
            const armor = [helm, gaunt, chest, leg, classItem];

            const helmStats = statsCacheFixedOrder.get(helm)!;
            const gauntStats = statsCacheFixedOrder.get(gaunt)!;
            const chestStats = statsCacheFixedOrder.get(chest)!;
            const legStats = statsCacheFixedOrder.get(leg)!;
            const classItemStats = statsCacheFixedOrder.get(classItem)!;

            // TODO: why not just another ordered list?
            // Start with the contribution of mods. Spread operator is slow.
            // Also dynamic property syntax is slow which is why we use the raw hashes here.
            const stats: number[] = [
              modStatsFixedOrder[0] +
                helmStats[0] +
                gauntStats[0] +
                chestStats[0] +
                legStats[0] +
                classItemStats[0],
              modStatsFixedOrder[1] +
                helmStats[1] +
                gauntStats[1] +
                chestStats[1] +
                legStats[1] +
                classItemStats[1],
              modStatsFixedOrder[2] +
                helmStats[2] +
                gauntStats[2] +
                chestStats[2] +
                legStats[2] +
                classItemStats[2],
              modStatsFixedOrder[3] +
                helmStats[3] +
                gauntStats[3] +
                chestStats[3] +
                legStats[3] +
                classItemStats[3],
              modStatsFixedOrder[4] +
                helmStats[4] +
                gauntStats[4] +
                chestStats[4] +
                legStats[4] +
                classItemStats[4],
              modStatsFixedOrder[5] +
                helmStats[5] +
                gauntStats[5] +
                chestStats[5] +
                legStats[5] +
                classItemStats[5],
            ];

            // TODO: avoid min/max?
            const tiers = [
              Math.min(Math.max(Math.floor(stats[0] / 10), 0), 10),
              Math.min(Math.max(Math.floor(stats[1] / 10), 0), 10),
              Math.min(Math.max(Math.floor(stats[2] / 10), 0), 10),
              Math.min(Math.max(Math.floor(stats[3] / 10), 0), 10),
              Math.min(Math.max(Math.floor(stats[4] / 10), 0), 10),
              Math.min(Math.max(Math.floor(stats[5] / 10), 0), 10),
            ];
            const totalTier = tiers[0] + tiers[1] + tiers[2] + tiers[3] + tiers[4] + tiers[5];
            let statRangeExceeded = false;
            for (let index = 0; index < 6; index++) {
              const value = stats[index];
              const range = statRangesFixedOrder[index];
              if (value > range.max) {
                range.max = value;
              }
              if (value < range.min) {
                range.min = value;
              }

              const tier = tiers[index];
              const filter = statFiltersFixedOrder[index];
              if (!filter.ignored && (tier > filter.max || tier < filter.min)) {
                statRangeExceeded = true;
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

            // Calculate the "tiers string" here, since most sets don't make it this far
            // A string version of the tier-level of each stat, must be lexically comparable
            // TODO: It seems like constructing and comparing tiersString would be expensive but it's less so
            // than comparing stat arrays element by element
            let tiersString = '';
            for (let index = 0; index < 6; index++) {
              const statIndex = statOrderToFixed[index];
              const value = stats[statIndex];
              const tier = tiers[statIndex];
              // Make each stat exactly one code unit so the string compares correctly
              const filter = statFiltersFixedOrder[statIndex];
              if (!filter.ignored) {
                tiersString += tier.toString(16);
              }

              // Separately track the stat ranges of sets that made it through all our filters
              const range = statRangesFilteredFixedOrder[statIndex];
              if (value > range.max) {
                range.max = value;
              }
              if (value < range.min) {
                range.min = value;
              }
            }

            numInserted++;
            if (!setTracker.insert(totalTier, tiersString, armor, stats)) {
              numRejectedAfterInsert++;
            }
          }
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

  const topSets = _.take(finalSets, RETURNED_ARMOR_SETS);

  return {
    sets: topSets.map(({ armor, stats }) => ({
      armor: armor.map((item) => item.id),
      stats: {
        2996146975: stats[0], // Stat "Mobility"
        392767087: stats[1], // Stat "Resilience"
        1943323491: stats[2], // Stat "Recovery"
        1735777505: stats[3], // Stat "Discipline"
        144602215: stats[4], // Stat "Intellect"
        4244567218: stats[5], // Stat "Strength"
      },
    })),
    combos,
    combosWithoutCaps,
    statRanges,
    statRangesFiltered,
  };
}
