import _ from 'lodash';
import { infoLog } from '../../utils/log';
import {
  ArmorStatHashes,
  ArmorStats,
  AutoStatModsSetting,
  LockableBucketHashes,
  LockableBuckets,
  StatFilters,
  StatRanges,
} from '../types';
import {
  pickAndAssignSlotIndependentMods,
  pickOptimalStatMods,
  precalculateStructures,
} from './process-utils';
import { SetTracker } from './set-tracker';
import {
  LockedProcessMods,
  ProcessArmorSet,
  ProcessItem,
  ProcessItemsByBucket,
  ProcessStatistics,
} from './types';

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
  /** When to use auto stat mods */
  autoStatMods: AutoStatModsSetting,
  onProgress: (remainingTime: number) => void
): {
  sets: ProcessArmorSet[];
  combos: number;
  /** The stat ranges of all sets that matched our filters & mod selection. */
  statRangesFiltered?: StatRanges;
  processInfo?: ProcessStatistics;
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
    autoStatMods !== AutoStatModsSetting.None,
    statOrder
  );
  const hasMods = Boolean(combatMods.length || activityMods.length || generalMods.length);

  const setStatistics = {
    skipReasons: {
      doubleExotic: 0,
      noExotic: 0,
      skippedLowTier: 0,
    },
    lowerBoundsExceeded: { timesChecked: 0, timesFailed: 0 },
    upperBoundsExceeded: { timesChecked: 0, timesFailed: 0 },
    modsStatistics: {
      earlyModsCheck: { timesChecked: 0, timesFailed: 0 },
      autoModsPick: { timesChecked: 0, timesFailed: 0 },
      finalAssignment: {
        modAssignmentAttempted: 0,
        modsAssignmentFailed: 0,
        autoModsAssignmentFailed: 0,
      },
    },
  };
  const processStatistics: ProcessStatistics = {
    numProcessed: 0,
    numValidSets: 0,
    statistics: setStatistics,
  };

  let elapsedSeconds = 0;

  for (const helm of helms) {
    for (const gaunt of gauntlets) {
      // For each additional piece, skip the whole branch if we've managed to get 2 exotics
      if (gaunt.isExotic && helm.isExotic) {
        setStatistics.skipReasons.doubleExotic += chests.length * legs.length * classItems.length;
        continue;
      }
      for (const chest of chests) {
        if (chest.isExotic && (gaunt.isExotic || helm.isExotic)) {
          setStatistics.skipReasons.doubleExotic += legs.length * classItems.length;
          continue;
        }
        for (const leg of legs) {
          if (leg.isExotic && (chest.isExotic || gaunt.isExotic || helm.isExotic)) {
            setStatistics.skipReasons.doubleExotic += classItems.length;
            continue;
          }

          if (anyExotic && !helm.isExotic && !gaunt.isExotic && !chest.isExotic && !leg.isExotic) {
            setStatistics.skipReasons.noExotic += classItems.length;
            continue;
          }

          for (const classItem of classItems) {
            processStatistics.numProcessed++;

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
            let prioTotalTier = 0;
            let okTotalTier = 0;
            let statRangeExceeded = false;
            for (let index = 0; index < 6; index++) {
              const tier = tiers[index];
              const filter = statFiltersInStatOrder[index];
              if (filter.priority !== 'ignored') {
                if (tier > filter.max) {
                  statRangeExceeded = true;
                }
                if (filter.priority === 'prioritized') {
                  prioTotalTier += tier;
                } else {
                  okTotalTier += tier;
                }
              }
            }

            const totalTier = prioTotalTier + okTotalTier;

            // Drop this set if it could never make it
            if (!setTracker.couldInsert(totalTier)) {
              setStatistics.skipReasons.skippedLowTier++;
            }

            setStatistics.upperBoundsExceeded.timesChecked++;
            if (statRangeExceeded) {
              setStatistics.upperBoundsExceeded.timesFailed++;
              continue;
            }

            const armor = [helm, gaunt, chest, leg, classItem];

            const neededStats = [0, 0, 0, 0, 0, 0];
            let needSomeStats = false;

            // Check in which stats we're lacking
            for (let index = 0; index < 6; index++) {
              const value = Math.min(Math.max(stats[index], 0), 100);
              const filter = statFiltersInStatOrder[index];

              if (filter.priority !== 'ignored') {
                const neededValue = filter.min * 10 - value;
                if (neededValue > 0) {
                  neededStats[index] = neededValue;
                  needSomeStats = true;
                }
              }
            }

            setStatistics.lowerBoundsExceeded.timesChecked++;
            if (needSomeStats && autoStatMods === AutoStatModsSetting.None) {
              setStatistics.lowerBoundsExceeded.timesFailed++;
              continue;
            }

            let statMods: number[] = [];
            // For armour 2 mods we ignore slot specific mods as we prefilter items based on energy requirements
            // TODO: this isn't a big part of the overall cost of the loop, but we could consider trying to slot
            // mods at every level (e.g. just helmet, just helmet+arms) and skipping this if they already fit.
            if (hasMods || needSomeStats) {
              const modsPick = pickAndAssignSlotIndependentMods(
                precalculatedInfo,
                setStatistics.modsStatistics,
                armor,
                needSomeStats ? neededStats : undefined
              );

              if (modsPick) {
                statMods = modsPick.modHashes;
              } else {
                continue;
              }
            }

            processStatistics.numValidSets++;

            // Calculate the "tiers string" here, since most sets don't make it this far
            // A string version of the tier-level of each stat, must be lexically comparable
            // TODO: It seems like constructing and comparing tiersString would be expensive but it's less so
            // than comparing stat arrays element by element
            // Maybe there is a way to avoid number formatting routines? Would be good to just stash those bytes in a lexically comparable ASCII string.

            if ($featureFlags.experimentalLoSettings) {
              let statTiersString = '';
              let prioT5s = 0;
              let okT5s = 0;
              let missingTiers = 0;
              for (let index = 0; index < 6; index++) {
                const tier = tiers[index];
                const value = stats[index];
                // Make each stat exactly one code unit so the string compares correctly
                const filter = statFiltersInStatOrder[index];
                if (filter.priority !== 'ignored') {
                  statTiersString += tier.toString(16);
                  if (filter.priority === 'prioritized') {
                    // using a power of 2 (16) instead of 11 is faster
                    if (value % 10 >= 5 && value < 100) {
                      prioT5s++;
                    }
                  } else {
                    if (value % 10 >= 5 && value < 100) {
                      okT5s++;
                    }
                  }
                  if (tier < filter.min) {
                    missingTiers += filter.min - tier;
                  }
                }

                // Track the stat ranges of sets that made it through all our filters
                const range = statRangesFilteredInStatOrder[index];
                if (value > range.max) {
                  range.max = value;
                }
                if (value < range.min) {
                  range.min = value;
                }
              }

              // Ordering is:
              // 1. Total armor tier (this is the primary index in setTracker, so not included in stats string)
              // 2. approx #needed stat mods
              // 3. Total tier in prioritized stats
              // X. considered-but-not-prioritized stats are included in the total tier already, so it'd be redundant here
              // 4. Number of .5s in prioritized stats
              // 5. Number of .5s in okStats
              // 6. Tiers according to stat order
              const tiersString =
                (15 - missingTiers).toString(16).padStart(2, '0') +
                prioTotalTier.toString(16).padStart(2, '0') +
                prioT5s.toString(16) +
                okT5s.toString(16) +
                statTiersString;
              // TODO Try using something like a B-Tree Map here?
              setTracker.insert(totalTier, tiersString, armor, stats, statMods);
            } else {
              let tiersString = '';
              for (let index = 0; index < 6; index++) {
                const tier = tiers[index];
                // Make each stat exactly one code unit so the string compares correctly
                const filter = statFiltersInStatOrder[index];
                if (filter.priority !== 'ignored') {
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

              setTracker.insert(totalTier, tiersString, armor, stats, statMods);
            }
          }
        }
      }

      // Report speed every so often
      const totalTime = performance.now() - pstart;
      const newElapsedSeconds = Math.floor(totalTime / 500);

      if (newElapsedSeconds > elapsedSeconds) {
        elapsedSeconds = newElapsedSeconds;
        const speed = (processStatistics.numProcessed * 1000) / totalTime;
        const remaining = Math.round((combos - processStatistics.numProcessed) / speed);
        onProgress(remaining);
      }
    }
  }

  const finalSets = setTracker.getArmorSets(RETURNED_ARMOR_SETS);

  const totalTime = performance.now() - pstart;

  infoLog(
    'loadout optimizer',
    'found',
    processStatistics.numValidSets,
    'stat mixes after processing',
    combos,
    'stat combinations in',
    totalTime,
    'ms - ',
    Math.floor((combos * 1000) / totalTime),
    'combos/s',
    // Split into multiple objects so console.log will show them all expanded
    'sets outright skipped:',
    setStatistics.skipReasons,
    'lower and upper bounds:',
    setStatistics.lowerBoundsExceeded,
    setStatistics.upperBoundsExceeded,
    'mod assignment stats:',
    'early check:',
    setStatistics.modsStatistics.earlyModsCheck,
    'auto mods pick:',
    setStatistics.modsStatistics.autoModsPick,
    setStatistics.modsStatistics
  );
  infoLog('loadout optimizer', 'auto stat mods', {
    cacheHits: precalculatedInfo.cache.cacheHits,
    cacheMisses: precalculatedInfo.cache.cacheMisses,
    cacheSuccesses: precalculatedInfo.cache.cacheSuccesses,
  });

  const sets = finalSets.map(({ armor, stats, statMods }) => {
    const statsWithoutAutoMods = statOrder.reduce((statObj, statHash, i) => {
      statObj[statHash] = stats[i];
      return statObj;
    }, {}) as ArmorStats;

    const allStatMods =
      (autoStatMods === AutoStatModsSetting.Maximize &&
        pickOptimalStatMods(precalculatedInfo, armor, stats, statFiltersInStatOrder)) ||
      statMods;

    return {
      armor: armor.map((item) => item.id),
      stats: statsWithoutAutoMods,
      statMods: allStatMods,
    };
  });

  return {
    sets,
    combos,
    statRangesFiltered,
    processInfo: processStatistics,
  };
}
