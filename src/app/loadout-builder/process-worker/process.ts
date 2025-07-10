import { MAX_STAT, MAX_TIER } from 'app/loadout/known-values';
import { filterMap } from 'app/utils/collections';
import { BucketHashes } from 'data/d2/generated-enums';
import { infoLog } from '../../utils/log';
import {
  ArmorBucketHashes,
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  MinMaxStat,
  StatRanges,
  artificeStatBoost,
  majorStatBoost,
  minorStatBoost,
} from '../types';
import { statTier } from '../utils';
import {
  pickAndAssignSlotIndependentMods,
  pickOptimalStatMods,
  precalculateStructures,
  updateMaxStats,
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
  /** If set, only sets where at least one stat **exceeds** `desiredStatRanges` minimums will be returned */
  strictUpgrades: boolean,
  /** If set, LO will exit after finding at least one set that fits all constraints (and is a strict upgrade if `strictUpgrades` is set) */
  stopOnFirstSet: boolean,
  /** If set, LO will use exact stat totals instead of tiers */
  tierlessStats: boolean,
): ProcessResult {
  const pstart = performance.now();

  if (tierlessStats) {
    infoLog(
      'loadout optimizer',
      'Tierless stats are not supported in the worker, falling back to tiered stats',
    );
  }

  // For efficiency, we'll handle most stats as flat arrays in the order the user prioritized their stats.
  const statOrder = desiredStatRanges.map(({ statHash }) => statHash as ArmorStatHashes);
  // The maximum stat constraints for each stat
  const maxStatConstraints = desiredStatRanges.map(({ maxStat }) => maxStat);
  // The maximum stat constraints for each stat, as a tier value
  const maxTierConstraints = maxStatConstraints.map(statTier);
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

  const setTracker = new SetTracker(RETURNED_ARMOR_SETS);

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

  const majorMinorRatio = majorStatBoost / minorStatBoost;

  // TODO: There's only a week left, maybe just switch over to tierless in place and keep it in a branch?
  if (tierlessStats) {
    itemLoop: for (const helm of helms) {
      const helmExotic = Number(helm.isExotic);
      const helmArtifice = Number(helm.isArtifice);
      const helmStats = statsCache.get(helm)!;
      for (const gaunt of gauntlets) {
        const gauntletExotic = Number(gaunt.isExotic);
        const gauntArtifice = Number(helm.isArtifice);
        const gauntStats = statsCache.get(gaunt)!;
        for (const chest of chests) {
          const chestExotic = Number(chest.isExotic);
          const chestArtifice = Number(helm.isArtifice);
          const chestStats = statsCache.get(chest)!;
          for (const leg of legs) {
            const legExotic = Number(leg.isExotic);
            const legArtifice = Number(helm.isArtifice);
            const legStats = statsCache.get(leg)!;
            for (const classItem of classItems) {
              const classItemExotic = Number(classItem.isExotic);
              const classItemArtifice = Number(helm.isArtifice);
              const classItemStats = statsCache.get(classItem)!;

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

              processStatistics.numProcessed++;

              // Sum up the stats of each piece to form the overall set stats.
              // Note that mod stats can take these negative. Note: JavaScript
              // engines apparently don't unroll loops automatically and this
              // makes a big difference in speed.
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

              // A version of the set stats that have been clamped to the max
              // stat constraint (and zero, because mod effects could make them
              // negative).
              const effectiveStats = [
                Math.min(Math.max(stats[0], 0), maxTierConstraints[0]),
                Math.min(Math.max(stats[1], 0), maxTierConstraints[1]),
                Math.min(Math.max(stats[2], 0), maxTierConstraints[2]),
                Math.min(Math.max(stats[3], 0), maxTierConstraints[3]),
                Math.min(Math.max(stats[4], 0), maxTierConstraints[4]),
                Math.min(Math.max(stats[5], 0), maxTierConstraints[5]),
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
                    const value = stats[index];
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

              // Check to see if it would be at all possible to hit the needed
              // stats with artifice armor or general mods (without taking into
              // account energy). If totalNeededStats is 0 this passes trivially.
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
              // TODO: OK so this is just a fast check to see if *any* mods can fit (including enough to hit needed stat minimums).
              if (hasMods || totalNeededStats > 0) {
                // TODO: does this need tierless logic? yes?
                // Do we need to distinguish between "needed stats" and "desired stats"?
                const modsPick = pickAndAssignSlotIndependentMods(
                  precalculatedInfo,
                  setStatistics.modsStatistics,
                  armor,
                  totalNeededStats > 0 ? neededStats : undefined,
                  numArtifice,
                );

                // TODO: keep around the mods pick so we can use it to decide remaining energy for stat mod assignment?
                if (!modsPick) {
                  // There's no way for this set to fit all requested mods while
                  // satisfying tier lower bounds, so continue on. setStatistics
                  // have been updated in pickAndAssignSlotIndependentMods.
                  continue;
                }
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
              // max available tier info stays accurate. For this calculation
              // we'll assume each artifice mod bumps the stat up a whole tier.
              if (
                !setTracker.couldInsert(
                  totalStats + numArtifice + precalculatedInfo.numAvailableGeneralMods,
                )
              ) {
                setStatistics.skipReasons.skippedLowTier++;
                continue;
              }

              // Starting from here, we end up mutating our effectiveStats array
              // a bit. We want to figure out the best stats for this set. We
              // can't do that for every set because it'd be too expensive.

              // TODO: This is maybe where we'd want to calculate "tuning mods"
              // contributions, but it might be better to just create different
              // variants of each item with each tuning mod slotted. Maybe we
              // can finally redo this as an integer programming problem?

              // TODO: These calculations do not take into account the
              // energy cost of the mods, so we can only use them to predict the
              // best possible stats that could theoretically be achieved.

              // Then spend artifice mods to boost stats greedily in stat
              // priority order.
              let artificeModsAvailable = numArtifice;
              let statsFromArtificeMods = 0;
              for (let pass = 0; pass < 2; pass++) {
                for (let index = 0; index < 6 && artificeModsAvailable > 0; index++) {
                  const value = effectiveStats[index];
                  const filter = desiredStatRanges[index];
                  if (value < filter.maxStat) {
                    const pointsToMax = filter.maxStat - value;
                    // How many artifice mods would that be?
                    const numArtificeModsUsed = Math.min(
                      Math.ceil(pointsToMax / artificeStatBoost),
                      artificeModsAvailable,
                    );
                    let statBoost = numArtificeModsUsed * artificeStatBoost;
                    // Wasted stats. We could maybe get a higher total tier if
                    // we spent this elsewhere. On the second pass we allow
                    // wasting stats.
                    if (pass === 0 && statBoost > pointsToMax) {
                      // Put it back
                      artificeModsAvailable++;
                      statBoost -= artificeStatBoost;
                    }
                    effectiveStats[index] += statBoost;
                    statsFromArtificeMods += statBoost;
                    artificeModsAvailable -= numArtificeModsUsed;
                  }
                }
              }

              // Also check how many +10 and +5 general mods we can use to boost stats.
              let generalModsAvailable = precalculatedInfo.numAvailableGeneralMods;
              let statsFromGeneralMods = 0;
              for (let pass = 0; pass < 2; pass++) {
                for (let index = 0; index < 6; index++) {
                  const value = effectiveStats[index];
                  const filter = desiredStatRanges[index];
                  if (value < filter.maxStat) {
                    const pointsToMax = filter.maxStat - value;
                    // How many +5 mods would that be?
                    let minorStatMods = Math.ceil(pointsToMax / minorStatBoost);
                    // Use +10 mods in place of two +5 mods
                    const majorStatMods = Math.floor(minorStatMods / majorMinorRatio);
                    minorStatMods -= majorStatMods * majorMinorRatio;

                    const numGeneralModsUsed = Math.min(
                      majorStatMods + minorStatMods,
                      generalModsAvailable,
                    );
                    let numMajorModsUsed = Math.min(majorStatMods, generalModsAvailable);
                    let numMinorModsUsed = Math.min(
                      minorStatMods,
                      generalModsAvailable - numMajorModsUsed,
                    );
                    let statBoost =
                      numMajorModsUsed * majorStatBoost + numMinorModsUsed * minorStatBoost;
                    // Wasted stats. We could maybe get a higher total tier if
                    // we spent this elsewhere. On the second pass we allow
                    // wasting stats. TODO: We could have a setting to allow
                    // wasting stats in order to max out other stats but since
                    // their effects are linear I don't know that it matters.
                    if (pass === 0 && statBoost > pointsToMax) {
                      // Put it back
                      if (numMinorModsUsed > 0) {
                        // If we used any minor mods, put one back
                        numMinorModsUsed--;
                      } else {
                        // Otherwise, swap a major mod for a minor mod
                        numMajorModsUsed--;
                        numMinorModsUsed++;
                      }
                      statBoost =
                        numMajorModsUsed * majorStatBoost + numMinorModsUsed * minorStatBoost;
                    }
                    effectiveStats[index] += statBoost;
                    statsFromGeneralMods += statBoost;
                    generalModsAvailable -= numGeneralModsUsed;
                  }
                }
              }

              // TODO: In the tiered mode the couldInsert check below only included stats from artifice mods
              const statsFromMods = statsFromArtificeMods + statsFromGeneralMods;

              // Now use our more accurate extra tiers prediction
              if (!setTracker.couldInsert(totalStats + statsFromMods)) {
                setStatistics.skipReasons.skippedLowTier++;
                continue;
              }

              // Calculate the "stats string" here, since most sets don't make
              // it this far A string version of each stat, must be lexically
              // comparable. It seems like constructing and comparing
              // tiersString would be expensive but it's less so than comparing
              // stat arrays element by element.
              let statsString = '';
              for (let index = 0; index < 6; index++) {
                const value = effectiveStats[index];
                const filter = desiredStatRanges[index];
                if (filter.maxStat > 0 /* non-ignored stat */) {
                  // represent each stat value as a single code unit (because they max out at 200)
                  statsString += String.fromCharCode(value);
                }
              }

              // TODO: Feels like we did a bunch of work to assign mods here,
              // maybe we should save some of it?

              processStatistics.numValidSets++;
              // And now insert our set using the predicted total tier and boosted stat tiers.
              setTracker.insert(totalStats + statsFromMods, statsString, armor, stats);

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
  } else {
    // Legacy Tiered stats processing. Remove after Edge of Fate releases.

    itemLoop: for (const helm of helms) {
      const helmExotic = Number(helm.isExotic);
      const helmArtifice = Number(helm.isArtifice);
      const helmStats = statsCache.get(helm)!;
      for (const gaunt of gauntlets) {
        const gauntletExotic = Number(gaunt.isExotic);
        const gauntArtifice = Number(helm.isArtifice);
        const gauntStats = statsCache.get(gaunt)!;
        for (const chest of chests) {
          const chestExotic = Number(chest.isExotic);
          const chestArtifice = Number(helm.isArtifice);
          const chestStats = statsCache.get(chest)!;
          for (const leg of legs) {
            const legExotic = Number(leg.isExotic);
            const legArtifice = Number(helm.isArtifice);
            const legStats = statsCache.get(leg)!;
            for (const classItem of classItems) {
              const classItemExotic = Number(classItem.isExotic);
              const classItemArtifice = Number(helm.isArtifice);
              const classItemStats = statsCache.get(classItem)!;

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

              processStatistics.numProcessed++;

              // Sum up the stats of each piece to form the overall set stats.
              // Note that mod stats can take these negative. Note: JavaScript
              // engines apparently don't unroll loops automatically and this
              // makes a big difference in speed.
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

              // Calculate the tier of each stat, capped by the max tier constraint
              const tiers = [
                Math.min(Math.max(Math.floor(stats[0] / 10), 0), maxTierConstraints[0]),
                Math.min(Math.max(Math.floor(stats[1] / 10), 0), maxTierConstraints[1]),
                Math.min(Math.max(Math.floor(stats[2] / 10), 0), maxTierConstraints[2]),
                Math.min(Math.max(Math.floor(stats[3] / 10), 0), maxTierConstraints[3]),
                Math.min(Math.max(Math.floor(stats[4] / 10), 0), maxTierConstraints[4]),
                Math.min(Math.max(Math.floor(stats[5] / 10), 0), maxTierConstraints[5]),
              ];

              // neededStats is the extra stats we'd need in each stat in order to
              // hit the stat minimums, and totalNeededStats is just the sum of
              // those. This informs the logic for deciding how to add stat mods.
              const neededStats = [0, 0, 0, 0, 0, 0];
              let totalNeededStats = 0;

              // Check which stats we're under the stat minimums on.
              let totalTier = 0;
              for (let index = 0; index < 6; index++) {
                const tier = tiers[index];
                const filter = desiredStatRanges[index];
                if (filter.maxStat > 0) {
                  // Update the minimum stat range while we're here
                  const statRange = statRanges[index];
                  if (tier * 10 < statRange.minStat) {
                    statRange.minStat = tier * 10;
                  }
                  totalTier += tier;
                  if (filter.minStat > 0) {
                    const value = stats[index];
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

              // Check to see if it would be at all possible to hit the needed
              // stats with artifice armor or general mods (without taking into
              // account energy). If totalNeededStats is 0 this passes trivially.
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
                  // There's no way for this set to fit all requested mods while
                  // satisfying tier lower bounds, so continue on. setStatistics
                  // have been updated in pickAndAssignSlotIndependentMods.
                  continue;
                }
              }

              // At this point we know this set satisfies all constraints. Update
              // the max stat ranges.
              const foundAnyImprovement = updateMaxTiers(
                precalculatedInfo,
                armor,
                stats,
                tiers,
                numArtifice,
                desiredStatRanges,
                statRanges,
              );

              // Drop this set if it could never make it into our top
              // RETURNED_ARMOR_SETS sets. We do this only after confirming that
              // any required stat mods fit and updating our max tiers so that the
              // max available tier info stays accurate. For this calculation
              // we'll assume each artifice mod bumps the stat up a whole tier.
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
                // TODO: I think this misses a case where we might be able to
                // increase by 2 tiers - e.g. if the stat is 8, we can increase it
                // to 20 with 4 artifice mods.
                if (stats[index] < filter.maxStat) {
                  statPointsNeededForTiers.push({
                    index,
                    pointsToNext: 10 - (stats[index] % 10),
                  });
                }
              }

              // Starting from here, we end up mutating our tiers array a bit
              // to make sorting more accurate.

              // Then spend artifice mods to boost tiers, from cheapest to most-expensive.
              // TODO: If we still have 3 or 4 artifice mods left, we can
              // probably make up another tier.
              let artificeModsAvailable = numArtifice;
              statPointsNeededForTiers.sort((a, b) => a.pointsToNext - b.pointsToNext);
              const tiersFromArtifice = statPointsNeededForTiers.reduce((numTiers, stat) => {
                const numArtificeModsUsed = Math.ceil(stat.pointsToNext / artificeStatBoost);
                if (numArtificeModsUsed <= artificeModsAvailable) {
                  // Bump up the tier for this stat
                  tiers[stat.index] += 1;
                  // TODO: why not just bump totalTier here too?
                  artificeModsAvailable -= numArtificeModsUsed;
                  return numTiers + 1;
                }
                return numTiers;
              }, 0);

              const tiersFromGeneralMods = precalculatedInfo.numAvailableGeneralMods;

              // TODO: It'd be neat to also spend small (+5) general mods, right now we
              // add `numAvailableGeneralMods` tiers (assume each item can hold a +10)
              // mod but this isn't always true.
              // TODO: This seems like a bad assumption (that we have energy left for all the stat mods)
              const tiersFromMods = tiersFromArtifice + tiersFromGeneralMods;

              // Now use our more accurate extra tiers prediction
              if (!setTracker.couldInsert(totalTier + tiersFromMods)) {
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
                if (filter.maxStat > 0) {
                  // Predict the tier boost from general mods.
                  // TODO: This isn't taking into account remaining energy, and it will "waste stats" if we're near the max tier.
                  const boostAmount = Math.min(statTier(filter.maxStat) - tier, numGeneralMods);
                  if (boostAmount > 0) {
                    tier += boostAmount;
                    numGeneralMods -= boostAmount;
                  }
                  // using a base16 instead of 11 is faster
                  tiersString += tier.toString(16);
                }
              }

              processStatistics.numValidSets++;
              // And now insert our set using the predicted total tier and
              // boosted stat tiers.
              setTracker.insert(totalTier + tiersFromMods, tiersString, armor, stats);

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
  }

  const finalSets = setTracker.getArmorSets();

  const sets = filterMap(finalSets, ({ armor, stats }) => {
    // This only fails if minimum tier requirements cannot be hit, but we know
    // they can because we ensured it internally.
    //
    // TODO: OK so this is maybe where we exhaustively search for the *best*
    // stat mods, not just the minimum required to hit the stat minimums. But
    // this also means that our optimistic prediction that we used to add to the
    // set tracker could end up smaller than what we predicted? That also makes
    // me think this could be out of order...
    const { mods, bonusStats } = pickOptimalStatMods(
      precalculatedInfo,
      armor,
      stats,
      desiredStatRanges,
      // tierlessStats,
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
        statFilter.maxStat > 0 /* enabled stat */ &&
        strictUpgrades &&
        statFilter.minStat < statFilter.maxStat &&
        !hasStrictUpgrade
      ) {
        if (tierlessStats) {
          const statValue = Math.min(Math.max(value, 0), MAX_STAT);
          hasStrictUpgrade ||= statValue > statFilter.minStat;
        } else {
          const tier = Math.min(Math.max(Math.floor(value / 10), 0), MAX_TIER);
          hasStrictUpgrade ||= tier > statTier(statFilter.minStat);
        }
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
