import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import { MAX_STAT } from 'app/loadout/known-values';
import { filterMap } from 'app/utils/collections';
import { BucketHashes } from 'data/d2/generated-enums';
import { infoLog } from '../../utils/log';
import {
  ArmorBucketHashes,
  ArmorStatHashes,
  ArmorStats,
  artificeStatBoost,
  DesiredStatRange,
  majorStatBoost,
  MinMaxStat,
  StatRanges,
} from '../types';
import {
  pickAndAssignSlotIndependentMods,
  pickOptimalStatMods,
  precalculateStructures,
  updateMaxStats,
} from './process-utils';
import { encodeStatMix, HeapSetTracker } from './set-tracker';
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

export interface ProcessInputs {
  filteredItems: ProcessItemsByBucket;
  /** Selected mods' total contribution to each stat */
  modStatTotals: ArmorStats;
  /** Mods to add onto the sets */
  lockedMods: LockedProcessMods;
  /** If we're requiring any set bonuses, the number of items desired from each set */
  setBonuses: SetBonusCounts;
  /** The user's chosen stat ranges, in priority order. */
  desiredStatRanges: DesiredStatRange[];
  /** Ensure every set includes one exotic */
  anyExotic: boolean;
  /** Which artifice/tuning mods, large, and small stat mods are available */
  autoModOptions: AutoModData;
  /** Use stat mods to hit stat minimums */
  autoStatMods: boolean;
  /** If set, only sets where at least one stat **exceeds** `desiredStatRanges` minimums will be returned */
  strictUpgrades: boolean;
  /** If set, LO will exit after finding at least one set that fits all constraints (and is a strict upgrade if `strictUpgrades` is set) */
  stopOnFirstSet: boolean;
}

/**
 * This processes all permutations of armor to build sets
 * @param filteredItems pared down list of items to process sets from
 * @param modStatTotals Stats that are applied to final stat totals, think general and other mod stats
 */
export function process({
  filteredItems,
  modStatTotals,
  lockedMods,
  setBonuses,
  desiredStatRanges,
  anyExotic,
  autoModOptions,
  autoStatMods,
  strictUpgrades,
  stopOnFirstSet,
}: ProcessInputs): ProcessResult {
  const pstart = performance.now();

  // For efficiency, we'll handle most stats as flat arrays in the order the user prioritized their stats.
  const statOrder = desiredStatRanges.map(({ statHash }) => statHash as ArmorStatHashes);
  // The maximum stat constraints for each stat
  const maxStatConstraints = desiredStatRanges.map(({ maxStat }) => maxStat);
  // Convert the list of stat bonuses from mods into a flat array in the same order as `statOrder`.
  const modStatsInStatOrder = statOrder.map((h) => modStatTotals[h]);

  // This stores the computed min and max value for each stat as we process all sets, so we
  // can display it on the stat constraint editor.
  const statRanges = statOrder.map((): MinMaxStat => ({ minStat: MAX_STAT, maxStat: 0 }));

  // Precompute stat arrays for each item in stat order
  const statsCache = new Map<ProcessItem, number[]>();
  for (const item of ArmorBucketHashes.flatMap((h) => filteredItems[h])) {
    statsCache.set(
      item,
      statOrder.map((statHash) => Math.max(item.stats[statHash], 0)),
    );
  }

  // Each of these groups has already been reduced (in useProcess.ts) to the
  // minimum number of items that are worth considering.
  const helms = filteredItems[BucketHashes.Helmet];
  const gauntlets = filteredItems[BucketHashes.Gauntlets];
  const chests = filteredItems[BucketHashes.ChestArmor];
  const legs = filteredItems[BucketHashes.LegArmor];
  const classItems = filteredItems[BucketHashes.ClassArmor];

  // The maximum possible combos we could possibly have
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

  const setTracker = new HeapSetTracker(RETURNED_ARMOR_SETS);

  const { activityMods, generalMods } = lockedMods;

  const precalculatedInfo = precalculateStructures(
    autoModOptions,
    generalMods,
    activityMods,
    autoStatMods,
    statOrder,
  );
  const hasMods = Boolean(activityMods.length || generalMods.length);

  const setStatistics: ProcessStatistics['statistics'] = {
    skipReasons: {
      doubleExotic: 0,
      noExotic: 0,
      skippedLowTier: 0,
      insufficientSetBonus: 0,
    },
    lowerBoundsExceeded: { timesChecked: 0, timesFailed: 0 },
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

  const setBonusHashes = Object.keys(setBonuses).map((h) => Number(h));
  const setBonusCounts = Object.values(setBonuses);

  itemLoop: for (const helm of helms) {
    const helmExotic = Number(helm.isExotic);
    const helmArtifice = Number(helm.isArtifice);
    const helmStats = statsCache.get(helm)!;
    for (const gaunt of gauntlets) {
      const gauntletExotic = Number(gaunt.isExotic);
      const gauntArtifice = Number(gaunt.isArtifice);
      const gauntStats = statsCache.get(gaunt)!;
      for (const chest of chests) {
        const chestExotic = Number(chest.isExotic);
        const chestArtifice = Number(chest.isArtifice);
        const chestStats = statsCache.get(chest)!;
        for (const leg of legs) {
          const legExotic = Number(leg.isExotic);
          const legArtifice = Number(leg.isArtifice);
          const legStats = statsCache.get(leg)!;
          innerloop: for (const classItem of classItems) {
            const classItemExotic = Number(classItem.isExotic);
            const classItemArtifice = Number(classItem.isArtifice);
            const classItemStats = statsCache.get(classItem)!;

            // Check exotic constraints
            const exoticSum =
              classItemExotic + helmExotic + gauntletExotic + chestExotic + legExotic;
            if (exoticSum > 1) {
              setStatistics.skipReasons.doubleExotic += 1;
              continue;
            }
            if (anyExotic && exoticSum === 0) {
              setStatistics.skipReasons.noExotic += 1;
              continue;
            }

            // Check set bonus requirements
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < setBonusHashes.length; i++) {
              const setHash = setBonusHashes[i];
              const setCount =
                Number(helm.setBonus === setHash) +
                Number(gaunt.setBonus === setHash) +
                Number(chest.setBonus === setHash) +
                Number(leg.setBonus === setHash) +
                Number(classItem.setBonus === setHash);
              if (setCount < setBonusCounts[setHash]) {
                setStatistics.skipReasons.insufficientSetBonus += 1;
                continue innerloop;
              }
            }

            processStatistics.numProcessed++;

            // Sum up the stats of each piece to form the overall set stats.
            // Note that mod stats could theoretically take these negative, but
            // none do in practice.
            //
            // Note: JavaScript engines apparently don't unroll loops
            // automatically and this makes a big difference in speed.
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

            // A version of the set stats that have been clamped to the max stat
            // constraint.
            const effectiveStats = [
              Math.min(stats[0], maxStatConstraints[0]),
              Math.min(stats[1], maxStatConstraints[1]),
              Math.min(stats[2], maxStatConstraints[2]),
              Math.min(stats[3], maxStatConstraints[3]),
              Math.min(stats[4], maxStatConstraints[4]),
              Math.min(stats[5], maxStatConstraints[5]),
            ];

            // neededStats is the extra stats we'd need in each stat in order to
            // hit the stat minimums, and totalNeededStats is just the sum of
            // those. This informs the logic for deciding how to add stat mods.
            const neededStats = [0, 0, 0, 0, 0, 0];
            let totalNeededStats = 0;

            // Check which stats we're under the stat minimums on.
            let totalStats = 0;
            for (let index = 0; index < 6; index++) {
              const value = effectiveStats[index];
              const filter = desiredStatRanges[index];
              if (filter.maxStat > 0 /* non-ignored stat */) {
                // Update the minimum stat range while we're here
                const statRange = statRanges[index];
                if (value < statRange.minStat) {
                  statRange.minStat = value;
                }
                totalStats += value;
                if (filter.minStat > 0) {
                  const neededValue = filter.minStat - value;
                  if (neededValue > 0) {
                    totalNeededStats += neededValue;
                    neededStats[index] = neededValue;
                  }
                }
              }
            }

            const numArtifice =
              helmArtifice + gauntArtifice + chestArtifice + legArtifice + classItemArtifice;

            // The most total stat points we could get from mods, assuming
            // everything was perfectly assignable.
            const maxModBonus =
              numArtifice * artificeStatBoost +
              precalculatedInfo.numAvailableGeneralMods * majorStatBoost;

            // Check to see if it would be at all possible to hit the needed
            // stat total with the best case mod bonuses. If totalNeededStats is
            // 0 this passes trivially.
            setStatistics.lowerBoundsExceeded.timesChecked++;
            if (totalNeededStats > maxModBonus) {
              setStatistics.lowerBoundsExceeded.timesFailed++;
              continue;
            }

            const armor = [helm, gaunt, chest, leg, classItem];

            // Items that individually can't fit their slot-specific mods were
            // filtered out before even passing them to the worker, so we only
            // do this combined mods + auto-stats check if we need to check
            // whether the set can fit the mods and hit target stats. This is a
            // fast check to see if enough mods can fit to hit needed stat
            // minimums.
            if (
              (hasMods || totalNeededStats > 0) &&
              !pickAndAssignSlotIndependentMods(
                precalculatedInfo,
                setStatistics.modsStatistics,
                armor,
                totalNeededStats > 0 ? neededStats : undefined,
                numArtifice,
              )
            ) {
              // There's no way for this set to fit all requested mods while
              // satisfying tier lower bounds, so continue on. setStatistics
              // have been updated in pickAndAssignSlotIndependentMods.
              continue;
            }

            // At this point we know this set satisfies all constraints.
            // Update the max stat ranges. We need to do this before we short
            // circuit anything so that the stat ranges are accurate.
            // TODO: Then updateMaxStats assigns auto mods AGAIN, potentially many times, to figure out the max possible stats in each stat individually.
            const foundAnyImprovement = updateMaxStats(
              precalculatedInfo,
              armor,
              stats,
              numArtifice,
              desiredStatRanges,
              statRanges,
            );

            // Drop this set if it could never make it into our top
            // RETURNED_ARMOR_SETS sets. We do this only after confirming that
            // any required stat mods fit and updating our max tiers so that the
            // max available tier info stays accurate.
            if (!setTracker.couldInsert(totalStats + maxModBonus)) {
              setStatistics.skipReasons.skippedLowTier++;
              continue;
            }

            const optimalResult = pickOptimalStatMods(
              precalculatedInfo,
              armor,
              stats,
              desiredStatRanges,
            );
            if (!optimalResult) {
              // This means we couldn't assign mods in a way that satisfied
              // minimum stat constraints. This can happen if the mods that
              // would be needed don't fit into the available slots.
              setStatistics.modsStatistics.finalAssignment.modsAssignmentFailed++;
              continue;
            }

            const { bonusStats, mods } = optimalResult;
            const finalStats = [
              effectiveStats[0] + bonusStats[0],
              effectiveStats[1] + bonusStats[1],
              effectiveStats[2] + bonusStats[2],
              effectiveStats[3] + bonusStats[3],
              effectiveStats[4] + bonusStats[4],
              effectiveStats[5] + bonusStats[5],
            ];
            const finalTotalStats =
              finalStats[0] +
              finalStats[1] +
              finalStats[2] +
              finalStats[3] +
              finalStats[4] +
              finalStats[5];

            // Now use our more accurate extra tiers prediction
            if (!setTracker.couldInsert(finalTotalStats)) {
              setStatistics.skipReasons.skippedLowTier++;
              continue;
            }

            // Calculate the numeric stat mix for fast integer comparison.
            // This encodes each stat value (0-200) into 8 bits, packed into a single integer.
            // Only non-ignored stats are included, maintaining lexical ordering for priority.
            const numericStatMix = encodeStatMix(finalStats, desiredStatRanges);

            processStatistics.numValidSets++;
            // And now insert our set using the predicted total tier and numeric stat mix.
            setTracker.insert(finalTotalStats, numericStatMix, armor, stats, mods, bonusStats);

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

  const finalSets = setTracker.getArmorSets();

  const sets = filterMap(finalSets, ({ armor, stats, mods, bonusStats }) => {
    const armorOnlyStats: Partial<ArmorStats> = {};
    const fullStats: Partial<ArmorStats> = {};

    let hasStrictUpgrade = false;

    for (let i = 0; i < statOrder.length; i++) {
      const statHash = statOrder[i];
      const value = stats[i] + bonusStats[i];
      fullStats[statHash] = value;

      const statFilter = desiredStatRanges[i];
      if (
        statFilter.maxStat > 0 /* enabled stat */ &&
        strictUpgrades &&
        statFilter.minStat < statFilter.maxStat &&
        !hasStrictUpgrade
      ) {
        const statValue = Math.min(Math.max(value, 0), MAX_STAT);
        hasStrictUpgrade ||= statValue > statFilter.minStat;
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
    'lower bounds:',
    setStatistics.lowerBoundsExceeded,
    'mod assignment stats:',
    'early check:',
    setStatistics.modsStatistics.earlyModsCheck,
    'auto mods pick:',
    setStatistics.modsStatistics.autoModsPick,
    setStatistics.modsStatistics,
  );

  const statRangesFiltered = Object.fromEntries(
    statRanges.map((h, i) => [statOrder[i], h]),
  ) as StatRanges;

  return {
    sets,
    combos,
    statRangesFiltered,
    processInfo: processStatistics,
  };
}
