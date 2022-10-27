import _ from 'lodash';
import { infoLog } from '../../utils/log';
import {
  ArmorStatHashes,
  ArmorStats,
  LockableBucketHashes,
  LockableBuckets,
  StatFilters,
  StatRanges,
} from '../types';
import { pickAndAssignSlotIndependentMods, precalculateStructures } from './process-utils';
import { SetTracker } from './set-tracker';
import { LockedProcessMods, ProcessArmorSet, ProcessItem, ProcessItemsByBucket } from './types';

/** Caps the maximum number of total armor sets that'll be returned */
const RETURNED_ARMOR_SETS = 200;

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
  lockedMods: LockedProcessMods,
  /** The user's chosen stat order, including disabled stats */
  statOrder: ArmorStatHashes[],
  statFilters: StatFilters,
  /** Ensure every set includes one exotic */
  anyExotic: boolean,
  /** Use stat mods to hit stat minimums */
  autoStatMods: boolean,
  onProgress: (remainingTime: number) => void
): {
  sets: ProcessArmorSet[];
  combos: number;
  /** The stat ranges of all sets that matched our filters & mod selection. */
  statRangesFiltered?: StatRanges;
} {
  const pstart = performance.now();

  const modStatsInStatOrder = statOrder.map((h) => modStatTotals[h]);
  const statFiltersInStatOrder = statOrder.map((h) => statFilters[h]);

  // This stores the computed min and max value for each stat as we process all sets, so we
  // can display it on the stat filter dropdowns
  const statRangesFiltered: StatRanges = _.mapValues(statFilters, () => ({
    min: 100,
    max: 0,
  }));
  const statRangesFilteredInStatOrder = statOrder.map((h) => statRangesFiltered[h]);

  // Store stat arrays for each items in stat order
  const statsCacheInStatOrder = new Map<ProcessItem, number[]>();

  // Precompute the stats of each item in stat order
  for (const item of LockableBucketHashes.flatMap((h) => filteredItems[h])) {
    statsCacheInStatOrder.set(
      item,
      statOrder.map((statHash) => Math.max(item.stats[statHash], 0))
    );
  }

  // Each of these groups has already been reduced (in useProcess.ts) to the
  // minimum number of examples that are worth considering.
  const helms = filteredItems[LockableBuckets.helmet];
  const gauntlets = filteredItems[LockableBuckets.gauntlets];
  const chests = filteredItems[LockableBuckets.chest];
  const legs = filteredItems[LockableBuckets.leg];
  const classItems = filteredItems[LockableBuckets.classitem];

  // The maximum possible combos we could have
  const combos = helms.length * gauntlets.length * chests.length * legs.length * classItems.length;
  const numItems =
    helms.length + gauntlets.length + chests.length + legs.length + classItems.length;

  infoLog('loadout optimizer', 'Processing', combos, 'combinations from', numItems, 'items', {
    helms: helms.length,
    gauntlets: gauntlets.length,
    chests: chests.length,
    legs: legs.length,
    classItems: classItems.length,
  });

  if (combos === 0) {
    return { sets: [], combos: 0 };
  }

  const setTracker = new SetTracker(10_000);

  const { activityMods, combatMods, generalMods } = lockedMods;

  const precalculatedInfo = precalculateStructures(
    generalMods,
    combatMods,
    activityMods,
    autoStatMods,
    statOrder
  );
  const hasMods = Boolean(combatMods.length || activityMods.length || generalMods.length);

  let numSkippedLowTier = 0;
  let numStatRangeExceeded = 0;
  let numCantSlotMods = 0;
  let numValidSets = 0;
  let numDoubleExotic = 0;
  let numNoExotic = 0;
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

            const helmStats = statsCacheInStatOrder.get(helm)!;
            const gauntStats = statsCacheInStatOrder.get(gaunt)!;
            const chestStats = statsCacheInStatOrder.get(chest)!;
            const legStats = statsCacheInStatOrder.get(leg)!;
            const classItemStats = statsCacheInStatOrder.get(classItem)!;

            // JavaScript engines apparently don't unroll loops automatically and this makes a big difference in speed.
            const stats = [
              modStatsInStatOrder[0] +
                helmStats[0] +
                gauntStats[0] +
                chestStats[0] +
                legStats[0] +
                classItemStats[0],
              modStatsInStatOrder[1] +
                helmStats[1] +
                gauntStats[1] +
                chestStats[1] +
                legStats[1] +
                classItemStats[1],
              modStatsInStatOrder[2] +
                helmStats[2] +
                gauntStats[2] +
                chestStats[2] +
                legStats[2] +
                classItemStats[2],
              modStatsInStatOrder[3] +
                helmStats[3] +
                gauntStats[3] +
                chestStats[3] +
                legStats[3] +
                classItemStats[3],
              modStatsInStatOrder[4] +
                helmStats[4] +
                gauntStats[4] +
                chestStats[4] +
                legStats[4] +
                classItemStats[4],
              modStatsInStatOrder[5] +
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

            // Check whether the set exceeds our stat constraints
            let totalTier = 0;
            let statRangeExceeded = false;
            for (let index = 0; index < 6; index++) {
              const tier = tiers[index];
              const filter = statFiltersInStatOrder[index];
              if (!filter.ignored) {
                if (tier > filter.max) {
                  statRangeExceeded = true;
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

            const armor = [helm, gaunt, chest, leg, classItem];

            const neededStats = [0, 0, 0, 0, 0, 0];
            let needSomeStats = false;

            // Check in which stats we're lacking
            for (let index = 0; index < 6; index++) {
              const value = Math.min(Math.max(stats[index], 0), 100);
              const filter = statFiltersInStatOrder[index];

              if (!filter.ignored) {
                const neededValue = filter.min * 10 - value;
                if (neededValue > 0) {
                  neededStats[index] = neededValue;
                  needSomeStats = true;
                }
              }
            }

            if (needSomeStats && !autoStatMods) {
              numStatRangeExceeded++;
              continue;
            }

            let statMods: number[] = [];
            // For armour 2 mods we ignore slot specific mods as we prefilter items based on energy requirements
            // TODO: this isn't a big part of the overall cost of the loop, but we could consider trying to slot
            // mods at every level (e.g. just helmet, just helmet+arms) and skipping this if they already fit.
            if (hasMods || needSomeStats) {
              const modPickResult = pickAndAssignSlotIndependentMods(
                precalculatedInfo,
                armor,
                needSomeStats ? neededStats : undefined
              );

              switch (modPickResult) {
                case 'cannot_hit_stats':
                  numStatRangeExceeded++;
                  continue;
                case 'mods_dont_fit':
                  numCantSlotMods++;
                  continue;
                default:
                  statMods = modPickResult.modHashes;
              }
            }

            // Calculate the "tiers string" here, since most sets don't make it this far
            // A string version of the tier-level of each stat, must be lexically comparable
            // TODO: It seems like constructing and comparing tiersString would be expensive but it's less so
            // than comparing stat arrays element by element
            // As a small improvement, we add a measure of how many auto stat mods we needed to get here in front,
            // this ensures that among sets with the same armor tier, the sets that required the fewest stat mods
            // are sorted first, and whether we needed 3 resilience mods and 1 discipline mod or 1 resilience mod
            // and 3 discipline mods does not matter at all when the user gave these lower bounds

            let tiersString = '';
            let missingTiers = 0;
            for (let index = 0; index < 6; index++) {
              const tier = tiers[index];
              // Make each stat exactly one code unit so the string compares correctly
              const filter = statFiltersInStatOrder[index];
              if (!filter.ignored) {
                if (tier < filter.min) {
                  missingTiers += filter.min - tier;
                }
                // using a power of 2 (16) instead of 11 is faster
                tiersString += tier.toString(16);
              }

              // Track the stat ranges of sets that made it through all our filters
              const range = statRangesFilteredInStatOrder[index];
              const value = stats[index];
              if (value > range.max) {
                range.max = value;
              }
              if (value < range.min) {
                range.min = value;
              }
            }

            numValidSets++;

            tiersString = (15 - missingTiers).toString(16) + tiersString;
            setTracker.insert(totalTier, tiersString, armor, stats, statMods);
          }
        }
      }

      // Report speed every so often
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

  const finalSets = setTracker.getArmorSets(RETURNED_ARMOR_SETS);

  if (finalSets.length) {
    // These ranges use the build stats without auto stat mods, so their
    // reported max can be lower than the supposed minimum from stat filters,
    // which looks very confusing. If any builds made it, either they already
    // had equal or higher stats, or we picked auto stat mods to get them there.
    // Doing it here is cheaper than summing up all the auto stat mods in the
    // loop as long as they're only picked to actually meet these lower bounds.
    for (let index = 0; index < 6; index++) {
      const filter = statFiltersInStatOrder[index];
      if (!filter.ignored) {
        const range = statRangesFilteredInStatOrder[index];
        range.min = Math.max(range.min, filter.min * 10);
        range.max = Math.max(range.min, range.max);
      }
    }
  }

  const totalTime = performance.now() - pstart;
  infoLog(
    'loadout optimizer',
    'found',
    numValidSets,
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
      numDoubleExotic,
      numNoExotic,
    }
  );
  infoLog('loadout optimizer', 'auto stat mods', {
    cacheHits: precalculatedInfo.cache.cacheHits,
    cacheMisses: precalculatedInfo.cache.cacheMisses,
    cacheSuccesses: precalculatedInfo.cache.cacheSuccesses,
  });

  const sets = finalSets.map(({ armor, stats, statMods }) => ({
    armor: armor.map((item) => item.id),
    stats: statOrder.reduce((statObj, statHash, i) => {
      statObj[statHash] = stats[i];
      return statObj;
    }, {}) as ArmorStats,
    statMods,
  }));

  return {
    sets,
    combos,
    statRangesFiltered,
  };
}
