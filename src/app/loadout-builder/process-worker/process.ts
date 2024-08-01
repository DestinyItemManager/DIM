import { filterMap } from 'app/utils/collections';
import { infoLog } from '../../utils/log';
import {
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  LockableBucketHashes,
  LockableBuckets,
  StatRanges,
  artificeStatBoost,
  majorStatBoost,
} from '../types';
import {
  pickAndAssignSlotIndependentMods,
  pickOptimalStatMods,
  precalculateStructures,
  updateMaxTiers,
} from './process-utils';
import { SetTracker } from './set-tracker';
import {
  AutoModData,
  LockedProcessMods,
  ProcessItem,
  ProcessItemsByBucket,
  ProcessResult,
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
  /** The user's chosen stat ranges, in priority order. */
  desiredStatRanges: DesiredStatRange[],
  /** Ensure every set includes one exotic */
  anyExotic: boolean,
  /** Which artifice mods, large, and small stat mods are available */
  autoModOptions: AutoModData,
  /** Use stat mods to hit stat minimums */
  autoStatMods: boolean,
  /** If set, only sets where at least one stat **exceeds** `resolvedStatConstraints` minimums will be returned */
  strictUpgrades: boolean,
  /** If set, LO will exit after finding at least one set that fits all constraints (and is a strict upgrade if `strictUpgrades` is set) */
  stopOnFirstSet: boolean,
): ProcessResult {
  const pstart = performance.now();

  const statOrder = desiredStatRanges.map(({ statHash }) => statHash as ArmorStatHashes);
  const maxTierConstraints = desiredStatRanges.map(({ maxTier }) => maxTier);
  const modStatsInStatOrder = statOrder.map((h) => modStatTotals[h]);

  // This stores the computed min and max value for each stat as we process all sets, so we
  // can display it on the stat filter dropdowns
  const statRangesFiltered = Object.fromEntries(
    statOrder.map((h) => [
      h,
      {
        minTier: 10,
        maxTier: 0,
      },
    ]),
  ) as StatRanges;
  const statRangesFilteredInStatOrder = statOrder.map((h) => statRangesFiltered[h]);

  // Store stat arrays for each items in stat order
  const statsCacheInStatOrder = new Map<ProcessItem, number[]>();

  // Precompute the stats of each item in stat order
  for (const item of LockableBucketHashes.flatMap((h) => filteredItems[h])) {
    statsCacheInStatOrder.set(
      item,
      statOrder.map((statHash) => Math.max(item.stats[statHash], 0)),
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

  const { activityMods, generalMods } = lockedMods;

  const precalculatedInfo = precalculateStructures(
    autoModOptions,
    generalMods,
    activityMods,
    autoStatMods,
    statOrder,
  );
  const hasMods = Boolean(activityMods.length || generalMods.length);

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

  itemLoop: for (const helm of helms) {
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
          for (const classItem of classItems) {
            if (
              classItem.isExotic &&
              (leg.isExotic || chest.isExotic || gaunt.isExotic || helm.isExotic)
            ) {
              setStatistics.skipReasons.doubleExotic += classItems.length;
              continue;
            }
            if (
              anyExotic &&
              !helm.isExotic &&
              !gaunt.isExotic &&
              !chest.isExotic &&
              !leg.isExotic &&
              !classItem.isExotic
            ) {
              setStatistics.skipReasons.noExotic += classItems.length;
              continue;
            }

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
              Math.min(Math.max(Math.floor(stats[0] / 10), 0), maxTierConstraints[0]),
              Math.min(Math.max(Math.floor(stats[1] / 10), 0), maxTierConstraints[1]),
              Math.min(Math.max(Math.floor(stats[2] / 10), 0), maxTierConstraints[2]),
              Math.min(Math.max(Math.floor(stats[3] / 10), 0), maxTierConstraints[3]),
              Math.min(Math.max(Math.floor(stats[4] / 10), 0), maxTierConstraints[4]),
              Math.min(Math.max(Math.floor(stats[5] / 10), 0), maxTierConstraints[5]),
            ];

            const neededStats = [0, 0, 0, 0, 0, 0];
            let totalNeededStats = 0;

            // Check in which stats we're lacking
            let totalTier = 0;
            for (let index = 0; index < 6; index++) {
              const tier = tiers[index];
              const filter = desiredStatRanges[index];
              if (filter.maxTier > 0) {
                const statRange = statRangesFilteredInStatOrder[index];
                if (tier < statRange.minTier) {
                  statRange.minTier = tier;
                }
                totalTier += tier;
                if (filter.minTier > 0) {
                  const value = stats[index];
                  const neededValue = filter.minTier * 10 - value;
                  if (neededValue > 0) {
                    totalNeededStats += neededValue;
                    neededStats[index] = neededValue;
                  }
                }
              }
            }

            const numArtifice =
              Number(helm.isArtifice) +
              Number(gaunt.isArtifice) +
              Number(chest.isArtifice) +
              Number(leg.isArtifice) +
              Number(classItem.isArtifice);

            setStatistics.lowerBoundsExceeded.timesChecked++;
            if (
              totalNeededStats >
              numArtifice * artificeStatBoost +
                precalculatedInfo.numAvailableGeneralMods * majorStatBoost
            ) {
              setStatistics.lowerBoundsExceeded.timesFailed++;
              continue;
            }

            const armor = [helm, gaunt, chest, leg, classItem];

            // Items that individually can't fit their slot-specific mods
            // were filtered out before even passing them to the worker,
            // so we only do this combined mods + auto-stats check if we
            // need to check whether the set can fit the mods and hit target stats.
            if (hasMods || totalNeededStats > 0) {
              const modsPick = pickAndAssignSlotIndependentMods(
                precalculatedInfo,
                setStatistics.modsStatistics,
                armor,
                totalNeededStats > 0 ? neededStats : undefined,
                numArtifice,
              );

              if (!modsPick) {
                // There's no way for this set to fit all requested mods
                // while satisfying tier lower bounds, so continue on.
                continue;
              }
            }

            // We know this set satisfies all constraints.
            // Update highest possible reachable tiers.
            const foundAnyImprovement = updateMaxTiers(
              precalculatedInfo,
              armor,
              stats,
              tiers,
              numArtifice,
              desiredStatRanges,
              statRangesFilteredInStatOrder,
            );

            // Drop this set if it could never make it.
            // We do this only after confirming that our stat mods fit and updating
            // our max tiers so that the max available tier info stays accurate.
            // First, pessimistically assume an artifice mod gives a whole tier.
            if (
              !setTracker.couldInsert(
                totalTier + numArtifice + precalculatedInfo.numAvailableGeneralMods,
              )
            ) {
              setStatistics.skipReasons.skippedLowTier++;
              continue;
            }

            // We want to figure out the best tiers for this set. We can't do that for every
            // set because it'd be too expensive, but realistically, artifice mods are
            // where sets can really get some more tiers compared to other sets.
            const statPointsNeededForTiers: { index: number; pointsToNext: number }[] = [];

            for (let index = 0; index < 6; index++) {
              const filter = desiredStatRanges[index];
              if (stats[index] < filter.maxTier * 10) {
                statPointsNeededForTiers.push({
                  index,
                  pointsToNext: 10 - (stats[index] % 10),
                });
              }
            }

            // Starting from here, we end up mutating our tiers array a bit
            // to make sorting more accurate.

            // Then spend artifice mods to boost tiers, from cheapest to most-expensive.
            // TODO: It'd be neat to also spend small (+5) general mods, right now we
            // add `numAvailableGeneralMods` tiers (assume each item can hold a +10)
            // mod but this isn't always true.
            let modsAvailable = numArtifice;
            statPointsNeededForTiers.sort((a, b) => a.pointsToNext - b.pointsToNext);
            const predictedExtraTiers =
              statPointsNeededForTiers.reduce((numTiers, stat) => {
                const numModsUsed = Math.ceil(stat.pointsToNext / artificeStatBoost);
                if (numModsUsed <= modsAvailable) {
                  tiers[stat.index] += 1;
                  modsAvailable -= numModsUsed;
                  return numTiers + 1;
                }
                return numTiers;
              }, 0) + precalculatedInfo.numAvailableGeneralMods;

            // Now use our more accurate extra tiers prediction
            if (!setTracker.couldInsert(totalTier + predictedExtraTiers)) {
              setStatistics.skipReasons.skippedLowTier++;
              continue;
            }

            // Calculate the "tiers string" here, since most sets don't make it this far
            // A string version of the tier-level of each stat, must be lexically comparable
            // It seems like constructing and comparing tiersString would be expensive but it's less so
            // than comparing stat arrays element by element
            let tiersString = '';
            let numGeneralMods = precalculatedInfo.numAvailableGeneralMods;
            for (let index = 0; index < 6; index++) {
              let tier = tiers[index];
              // Make each stat exactly one code unit so the string compares correctly
              const filter = desiredStatRanges[index];
              if (filter.maxTier > 0) {
                // Predict the tier boost from general mods.
                const boostAmount = Math.min(filter.maxTier - tier, numGeneralMods);
                if (boostAmount > 0) {
                  tier += boostAmount;
                  numGeneralMods -= boostAmount;
                }
                // using a power of 2 (16) instead of 11 is faster
                tiersString += tier.toString(16);
              }
            }

            processStatistics.numValidSets++;
            // And now insert our set using the predicted total tier and boosted stat tiers.
            setTracker.insert(totalTier + predictedExtraTiers, tiersString, armor, stats);

            if (stopOnFirstSet) {
              if (strictUpgrades) {
                if (foundAnyImprovement) {
                  break itemLoop;
                }
              } else {
                break itemLoop;
              }
            }
          }
        }
      }
    }
  }

  const finalSets = setTracker.getArmorSets(RETURNED_ARMOR_SETS);

  const sets = filterMap(finalSets, ({ armor, stats }) => {
    // This only fails if minimum tier requirements cannot be hit, but we know they can because
    // we ensured it internally.
    const { mods, bonusStats } = pickOptimalStatMods(
      precalculatedInfo,
      armor,
      stats,
      desiredStatRanges,
    )!;

    const armorOnlyStats: Partial<ArmorStats> = {};
    const fullStats: Partial<ArmorStats> = {};

    let hasStrictUpgrade = false;

    for (let i = 0; i < statOrder.length; i++) {
      const statHash = statOrder[i];
      const value = stats[i] + bonusStats[i];
      fullStats[statHash] = value;

      const statFilter = desiredStatRanges[i];
      if (
        statFilter.maxTier > 0 &&
        strictUpgrades &&
        statFilter.minTier < statFilter.maxTier &&
        !hasStrictUpgrade
      ) {
        const tier = Math.min(Math.max(Math.floor(value / 10), 0), 10);
        hasStrictUpgrade ||= tier > statFilter.minTier;
      }

      armorOnlyStats[statHash] = stats[i] - modStatsInStatOrder[i];
    }

    if (strictUpgrades && !hasStrictUpgrade) {
      return undefined;
    }

    return {
      armor: armor.map((item) => item.id),
      stats: fullStats as ArmorStats,
      armorStats: armorOnlyStats as ArmorStats,
      statMods: mods,
    };
  });

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
    setStatistics.modsStatistics,
  );

  return {
    sets,
    combos,
    statRangesFiltered,
    processInfo: processStatistics,
  };
}
