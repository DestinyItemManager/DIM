import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import { MAX_STAT } from 'app/loadout/known-values';
import { compact, filterMap } from 'app/utils/collections';
import { BucketHashes } from 'data/d2/generated-enums';
import { sum } from 'es-toolkit';
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
import { getPower } from '../utils';
import { ablation } from './ablation-toggles';
import {
  LoSessionInfo,
  pickAndAssignSlotIndependentMods,
  pickOptimalStatMods,
  precalculateStructures,
  SetEnergyCache,
  updateMaxStats,
} from './process-utils';
import { encodeStatMix, HeapSetTracker } from './set-tracker';
import {
  AutoModData,
  LockedProcessMods,
  ModAssignmentStatistics,
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
  /**
   * Required armor perks and how many items in the set must have each perk.
   * Duplicate entries in the source perks array are collapsed into counts here.
   */
  requiredPerks: { hash: number; count: number }[];
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
export async function process(
  workerNum: number,
  {
    filteredItems,
    modStatTotals,
    lockedMods,
    setBonuses,
    requiredPerks,
    desiredStatRanges,
    anyExotic,
    autoModOptions,
    autoStatMods,
    strictUpgrades,
    stopOnFirstSet,
  }: ProcessInputs,
  onProgress: (completed: number) => void,
): Promise<ProcessResult> {
  const pstart = performance.now();

  // Ablation bench: hoist the toggles into locals once per run so the hot loop
  // pays a predicted branch on a local, not a property read.
  const {
    subtreePrune: useSubtreePrune,
    rangeSeeding: useRangeSeeding,
    convergenceGate: useConvergenceGate,
    energyCache: useEnergyCache,
    highStatSort: useHighStatSort,
    tuningPreGate: useTuningPreGate,
    coarseLevelPrunes: useCoarseLevelPrunes,
    unrolledAdds: useUnrolledAdds,
  } = ablation;

  // For efficiency, we'll handle most stats as flat arrays in the order the user prioritized their stats.
  const statOrder = desiredStatRanges.map(({ statHash }): ArmorStatHashes => statHash);
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
      statOrder.map((statHash) => item.stats[statHash]),
    );
  }

  // Each of these groups has already been reduced (in useProcess.ts) to the
  // minimum number of items that are worth considering.
  const helms = filteredItems[BucketHashes.Helmet];
  const gauntlets = filteredItems[BucketHashes.Gauntlets];
  const chests = filteredItems[BucketHashes.ChestArmor];
  const legs = filteredItems[BucketHashes.LegArmor];
  const classItems = filteredItems[BucketHashes.ClassArmor];
  const buckets = [helms, gauntlets, chests, legs, classItems];

  // Visit high-stat items first so the top-200 heap fills with good sets early,
  // which lets the couldInsert prune reject low-total sets much sooner. This
  // doesn't change the results: the enumerated combination set is the same and
  // the top 200 under the tracker's ordering is order-independent.
  const enabledStatsTotal = (item: ProcessItem) => {
    const itemStats = statsCache.get(item)!;
    let total = 0;
    for (let i = 0; i < 6; i++) {
      if (desiredStatRanges[i].maxStat > 0) {
        total += itemStats[i];
      }
    }
    return total;
  };
  if (useHighStatSort) {
    for (const bucket of buckets) {
      bucket.sort((a, b) => enabledStatsTotal(b) - enabledStatsTotal(a));
    }
  }

  // The maximum possible combos we could possibly have
  const combos = helms.length * gauntlets.length * chests.length * legs.length * classItems.length;
  const numItems =
    helms.length + gauntlets.length + chests.length + legs.length + classItems.length;

  infoLog(
    `loadout optimizer thread ${workerNum}`,
    'Processing',
    combos,
    'combinations from',
    numItems,
    'items',
    // Stringified because these workers get terminated when the run ends, and
    // DevTools can't inspect live objects logged from a dead worker.
    JSON.stringify({
      helms: helms.length,
      gauntlets: gauntlets.length,
      chests: chests.length,
      legs: legs.length,
      classItems: classItems.length,
    }),
  );

  const setStatistics: ProcessStatistics['statistics'] = {
    skipReasons: {
      doubleExotic: 0,
      noExotic: 0,
      skippedLowTier: 0,
      insufficientSetBonus: 0,
      insufficientPerks: 0,
      subtreePruned: 0,
      tuningGatePruned: 0,
      trackerFloorPruned: 0,
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

  if (combos === 0) {
    const statRangesFiltered = Object.fromEntries(
      statOrder.map((h) => [h, { minStat: 0, maxStat: MAX_STAT }]),
    ) as StatRanges;
    return { sets: [], combos: 0, statRangesFiltered, processInfo: processStatistics };
  }

  const setTracker = new HeapSetTracker<{
    /** The armor items in this set. */
    armor: ProcessItem[];
    /** The stats associated with this armor set. */
    stats: number[];
    mods: number[];
    bonusStats: number[];
    /** Stat deltas of the tuning mod chosen for the set's tunable item, if any. */
    tuningDeltas: number[] | undefined;
  }>(RETURNED_ARMOR_SETS);

  const { activityMods, generalMods } = lockedMods;

  const precalculatedInfo = precalculateStructures(
    autoModOptions,
    generalMods,
    activityMods,
    autoStatMods,
    statOrder,
  );
  const hasMods = Boolean(activityMods.length || generalMods.length);

  const setBonusHashes = Object.keys(setBonuses).map((h) => Number(h));
  const setBonusCounts = Object.values(setBonuses) as number[]; // TS won't figure this out itself?

  const yieldTask = makeYieldTask();

  let comboCount = 0;
  // required perks' hashes and counts, in matching order
  const perkHashes = requiredPerks.map((p) => p.hash);
  const requiredPerkCounts = requiredPerks.map((p) => p.count);
  const numPerks = requiredPerks.length;
  const hasPerkReqs = numPerks > 0;

  // Parallel per-bucket arrays so the hot loop reads flat numbers instead of
  // hashing into maps, converting booleans, or allocating per combination.
  const soas = buckets.map((bucket) =>
    buildBucketSoA(bucket, statsCache, setBonusHashes, perkHashes, statOrder, desiredStatRanges),
  );
  const [helmSoA, gauntSoA, chestSoA, legSoA, classItemSoA] = soas;

  const numSetBonuses = setBonusHashes.length;

  // How many combinations a subtree prune at each loop level skips
  const combosPerHelm = gauntlets.length * chests.length * legs.length * classItems.length;
  const combosPerGaunt = chests.length * legs.length * classItems.length;
  const combosPerChest = legs.length * classItems.length;
  const combosPerLeg = classItems.length;

  // Whether any later bucket could still contribute an exotic, per level. When
  // this is false and the partial set has no exotic, no completion can satisfy
  // anyExotic, so the whole subtree can be skipped.
  const exoticAfterHelm =
    gauntSoA.hasExotic || chestSoA.hasExotic || legSoA.hasExotic || classItemSoA.hasExotic;
  const exoticAfterGaunt = chestSoA.hasExotic || legSoA.hasExotic || classItemSoA.hasExotic;
  const exoticAfterChest = legSoA.hasExotic || classItemSoA.hasExotic;
  const exoticAfterLeg = classItemSoA.hasExotic;

  // Per-perk / set-bonus maximum contribution of the remaining buckets at each
  // level. If even the best-case completion can't reach a requirement, the
  // subtree can be skipped.
  const maxPerksAfterHelm = new Array<number>(numPerks);
  const maxPerksAfterGaunt = new Array<number>(numPerks);
  const maxPerksAfterChest = new Array<number>(numPerks);
  const maxPerksAfterLeg = new Array<number>(numPerks);
  for (let i = 0; i < numPerks; i++) {
    maxPerksAfterLeg[i] = classItemSoA.maxPerks[i];
    maxPerksAfterChest[i] = maxPerksAfterLeg[i] + legSoA.maxPerks[i];
    maxPerksAfterGaunt[i] = maxPerksAfterChest[i] + chestSoA.maxPerks[i];
    maxPerksAfterHelm[i] = maxPerksAfterGaunt[i] + gauntSoA.maxPerks[i];
  }
  const maxSetContribAfterLeg = classItemSoA.maxSetContrib;
  const maxSetContribAfterChest = maxSetContribAfterLeg + legSoA.maxSetContrib;
  const maxSetContribAfterGaunt = maxSetContribAfterChest + chestSoA.maxSetContrib;
  const maxSetContribAfterHelm = maxSetContribAfterGaunt + gauntSoA.maxSetContrib;

  // ---------- Stat-total suffix bounds for branch-and-bound subtree pruning ----------
  // The helm bucket needs no bounds: suffix bounds cover the buckets after
  // each level, and the range seeding computes its own floors.
  const [, gauntB, chestB, legB, classB] = soas.map((soa, i) =>
    computeBucketStatBounds(soa, buckets[i].length, maxStatConstraints),
  );
  // Suffix stat bounds = the summed bounds of every bucket after this level, so
  // the best/worst any completion could reach.
  const maxStatsAfterLeg = classB.max;
  const minStatsAfterLeg = classB.min;
  const maxStatsAfterChest = addVectors(legB.max, maxStatsAfterLeg);
  const minStatsAfterChest = addVectors(legB.min, minStatsAfterLeg);
  const maxStatsAfterGaunt = addVectors(chestB.max, maxStatsAfterChest);
  const minStatsAfterGaunt = addVectors(chestB.min, minStatsAfterChest);
  const maxTotalAfterLeg = classB.maxTotal;
  const maxTotalAfterChest = maxTotalAfterLeg + legB.maxTotal;
  const maxTotalAfterGaunt = maxTotalAfterChest + chestB.maxTotal;
  const maxTotalAfterHelm = maxTotalAfterGaunt + gauntB.maxTotal;
  const maxStatsAfterHelm = addVectors(gauntB.max, maxStatsAfterGaunt);
  const minStatsAfterHelm = addVectors(gauntB.min, minStatsAfterGaunt);
  const artificeAfterLeg = classB.hasArtifice ? 1 : 0;
  const artificeAfterChest = artificeAfterLeg + (legB.hasArtifice ? 1 : 0);
  const artificeAfterGaunt = artificeAfterChest + (chestB.hasArtifice ? 1 : 0);
  const artificeAfterHelm = artificeAfterGaunt + (gauntB.hasArtifice ? 1 : 0);

  const { maxTuningDelta, minTuningDelta, maxTuningNetGain } = computeTuningDeltaBounds(soas);

  const generalModsBonus = precalculatedInfo.numAvailableGeneralMods * majorStatBoost;
  const maxStatValue = MAX_STAT;
  // Scratch for canPruneSubtree's per-stat reserved-mod amounts (avoids a
  // per-call allocation in this frequently-called prune).
  const reservedScratch = [0, 0, 0, 0, 0, 0];

  // A set can affect the output in only three ways: enter the top-N tracker,
  // raise an observed max stat range, or lower an observed min stat range. If no
  // completion of the buckets after this level could do any of them, the whole
  // subtree can be skipped without changing results. This works on any data
  // (unlike item domination) because the tracker floor and the stat ranges
  // saturate as good/extreme sets are seen. `partialStats`/`partialArtifice` are
  // the mod stats plus the items chosen so far.
  const canPruneSubtree = (
    suffixMax: number[],
    suffixMin: number[],
    suffixArtifice: number,
    suffixMaxTotal: number,
    partialStats: number[],
    partialArtifice: number,
  ): boolean => {
    const bonusBound = (partialArtifice + suffixArtifice) * artificeStatBoost + generalModsBonus;
    let upperTotal = 0;
    let partialTotal = 0;
    for (let i = 0; i < 6; i++) {
      if (maxStatConstraints[i] > 0) {
        upperTotal += Math.min(
          partialStats[i] + suffixMax[i] + maxTuningDelta[i],
          maxStatConstraints[i],
        );
        partialTotal += partialStats[i];
      }
    }
    // Tightest valid total upper bound: the per-stat-clamped sum, or the partial
    // plus the best single-item totals of the remaining buckets — whichever is
    // lower. The latter is far tighter on stat-specialized real armor.
    const boundTotal = Math.min(upperTotal, partialTotal + suffixMaxTotal);
    if (setTracker.couldInsert(boundTotal + bonusBound + maxTuningNetGain)) {
      return false;
    }
    // Stat mods that must be spent bringing other stats up to their minimums
    // (best case: each other stat at its subtree max) can't also boost stat i,
    // so the max-range bound reserves them. All zero when there are no minimums.
    let totalReserved = 0;
    for (let j = 0; j < 6; j++) {
      const filter = desiredStatRanges[j];
      let r = 0;
      if (filter.maxStat > 0 && filter.minStat > 0) {
        const best = Math.min(maxStatValue, partialStats[j] + suffixMax[j] + maxTuningDelta[j]);
        if (filter.minStat > best) {
          r = filter.minStat - best;
        }
      }
      reservedScratch[j] = r;
      totalReserved += r;
    }
    for (let i = 0; i < 6; i++) {
      const statRange = statRanges[i];
      // Could any completion raise this max stat range? Mirrors updateMaxStats:
      // bump maxStat to the filter minimum, or to an achievable value above the
      // observed max. Mods reserved for the other minimums can't boost stat i.
      const reservedForOthers = totalReserved - reservedScratch[i];
      const modBudget = bonusBound > reservedForOthers ? bonusBound - reservedForOthers : 0;
      if (
        statRange.maxStat < desiredStatRanges[i].minStat ||
        Math.min(maxStatValue, partialStats[i] + suffixMax[i] + maxTuningDelta[i] + modBudget) >
          statRange.maxStat
      ) {
        return false;
      }
      // Could any completion lower this min stat range?
      if (
        maxStatConstraints[i] > 0 &&
        Math.min(partialStats[i] + suffixMin[i] + minTuningDelta[i], maxStatConstraints[i]) <
          statRange.minStat
      ) {
        return false;
      }
    }
    return true;
  };

  // Reused across iterations to avoid per-combo allocation in this hot loop.
  // Safe because each is only read within one iteration and copied before being
  // stored in the set tracker. The statsAfter*/perksAfter*/setCountsAfter*
  // arrays hold running partial sums for the outer loop levels so the
  // innermost loop only adds the class item's contribution.
  const stats = [0, 0, 0, 0, 0, 0];
  const effectiveStats = [0, 0, 0, 0, 0, 0];
  const neededStats = [0, 0, 0, 0, 0, 0];
  const armor: ProcessItem[] = new Array<ProcessItem>(5);
  // Shares the activity-mod energy computation between updateMaxStats and
  // pickOptimalStatMods for the same armor set; cleared per combination.
  const energyCache: SetEnergyCache = { result: undefined };
  const statsAfterHelm = [0, 0, 0, 0, 0, 0];
  const statsAfterGaunt = [0, 0, 0, 0, 0, 0];
  const statsAfterChest = [0, 0, 0, 0, 0, 0];
  const statsAfterLeg = [0, 0, 0, 0, 0, 0];
  const perksAfterHelm = new Array<number>(numPerks).fill(0);
  const perksAfterGaunt = new Array<number>(numPerks).fill(0);
  const perksAfterChest = new Array<number>(numPerks).fill(0);
  const perksAfterLeg = new Array<number>(numPerks).fill(0);
  const setCountsAfterHelm = new Array<number>(numSetBonuses).fill(0);
  const setCountsAfterGaunt = new Array<number>(numSetBonuses).fill(0);
  const setCountsAfterChest = new Array<number>(numSetBonuses).fill(0);
  const setCountsAfterLeg = new Array<number>(numSetBonuses).fill(0);
  // All-zero "previous level" counts for the top (helm) level.
  const zeroPerkCounts = new Array<number>(numPerks).fill(0);
  const zeroSetCounts = new Array<number>(numSetBonuses).fill(0);

  // Hot counters are kept in locals and flushed into the statistics objects
  // after the loop, to avoid nested property writes per combination.
  let numProcessed = 0;
  let lowerBoundsChecked = 0;
  let lowerBoundsFailed = 0;
  let skipDoubleExotic = 0;
  let skipNoExotic = 0;
  let skipInsufficientPerks = 0;
  let skipInsufficientSetBonus = 0;
  let skipLowTier = 0;
  // Ablation bench: skipLowTier split by which prune credited it.
  let skipSubtree = 0;
  let skipTuningGate = 0;
  let skipTrackerFloor = 0;

  // Subtree prunes add the whole skipped subtree size to comboCount, so a
  // single flush can report far more than 100k combos; onProgress takes a
  // delta, so that's fine.
  const flushProgress = async () => {
    onProgress(comboCount);
    comboCount = 0;
    if (yieldTask) {
      await yieldTask();
    }
  };

  // Seed the exact ranges whenever no exotic/perk/set-bonus requirement
  // couples the buckets, which makes the subtree range checks non-blocking so
  // the tracker-floor prune can skip almost the whole search.
  if (useRangeSeeding && !anyExotic && numPerks === 0 && numSetBonuses === 0) {
    seedExactStatRanges(
      soas,
      buckets,
      statsCache,
      modStatsInStatOrder,
      maxStatConstraints,
      desiredStatRanges,
      statRanges,
      precalculatedInfo,
      hasMods,
      setStatistics.modsStatistics,
    );
  }

  itemLoop: for (let helmIdx = 0; helmIdx < helms.length; helmIdx++) {
    const helm = helms[helmIdx];
    const exoticP1 = helmSoA.exotic[helmIdx];
    // A single item can't be a double exotic; only the noExotic prune can
    // apply at this level, and only when no later bucket has exotics either.
    if (useCoarseLevelPrunes && anyExotic && exoticP1 === 0 && !exoticAfterHelm) {
      skipNoExotic += combosPerHelm;
      comboCount += combosPerHelm;
      if (comboCount >= 100000) {
        await flushProgress();
      }
      continue;
    }
    if (
      hasPerkReqs &&
      perkCountsPrune(
        helmSoA,
        helmIdx,
        zeroPerkCounts,
        perksAfterHelm,
        maxPerksAfterHelm,
        requiredPerkCounts,
      ) &&
      useCoarseLevelPrunes
    ) {
      skipInsufficientPerks += combosPerHelm;
      comboCount += combosPerHelm;
      if (comboCount >= 100000) {
        await flushProgress();
      }
      continue;
    }
    const wildcardP1 = helmSoA.wildcard[helmIdx];
    if (
      numSetBonuses > 0 &&
      setBonusPrune(
        helmSoA,
        helmIdx,
        zeroSetCounts,
        setCountsAfterHelm,
        setBonusCounts,
        wildcardP1,
        maxSetContribAfterHelm,
      ) &&
      useCoarseLevelPrunes
    ) {
      skipInsufficientSetBonus += combosPerHelm;
      comboCount += combosPerHelm;
      if (comboCount >= 100000) {
        await flushProgress();
      }
      continue;
    }
    const artificeP1 = helmSoA.artifice[helmIdx];
    if (useUnrolledAdds) {
      addItemStats(statsAfterHelm, modStatsInStatOrder, helmSoA.stats, helmIdx * 6);
    } else {
      addItemStatsRolled(statsAfterHelm, modStatsInStatOrder, helmSoA.stats, helmIdx * 6);
    }
    if (
      useSubtreePrune &&
      canPruneSubtree(
        maxStatsAfterHelm,
        minStatsAfterHelm,
        artificeAfterHelm,
        maxTotalAfterHelm,
        statsAfterHelm,
        artificeP1,
      )
    ) {
      skipLowTier += combosPerHelm;
      skipSubtree += combosPerHelm;
      comboCount += combosPerHelm;
      if (comboCount >= 100000) {
        await flushProgress();
      }
      continue;
    }
    for (let gauntIdx = 0; gauntIdx < gauntlets.length; gauntIdx++) {
      const gaunt = gauntlets[gauntIdx];
      const exoticP2 = exoticP1 + gauntSoA.exotic[gauntIdx];
      if (useCoarseLevelPrunes && exoticP2 > 1) {
        skipDoubleExotic += combosPerGaunt;
        comboCount += combosPerGaunt;
        if (comboCount >= 100000) {
          await flushProgress();
        }
        continue;
      }
      if (useCoarseLevelPrunes && anyExotic && exoticP2 === 0 && !exoticAfterGaunt) {
        skipNoExotic += combosPerGaunt;
        comboCount += combosPerGaunt;
        if (comboCount >= 100000) {
          await flushProgress();
        }
        continue;
      }
      if (
        hasPerkReqs &&
        perkCountsPrune(
          gauntSoA,
          gauntIdx,
          perksAfterHelm,
          perksAfterGaunt,
          maxPerksAfterGaunt,
          requiredPerkCounts,
        ) &&
        useCoarseLevelPrunes
      ) {
        skipInsufficientPerks += combosPerGaunt;
        comboCount += combosPerGaunt;
        if (comboCount >= 100000) {
          await flushProgress();
        }
        continue;
      }
      const wildcardP2 = wildcardP1 + gauntSoA.wildcard[gauntIdx];
      if (
        numSetBonuses > 0 &&
        setBonusPrune(
          gauntSoA,
          gauntIdx,
          setCountsAfterHelm,
          setCountsAfterGaunt,
          setBonusCounts,
          wildcardP2,
          maxSetContribAfterGaunt,
        ) &&
        useCoarseLevelPrunes
      ) {
        skipInsufficientSetBonus += combosPerGaunt;
        comboCount += combosPerGaunt;
        if (comboCount >= 100000) {
          await flushProgress();
        }
        continue;
      }
      const artificeP2 = artificeP1 + gauntSoA.artifice[gauntIdx];
      if (useUnrolledAdds) {
        addItemStats(statsAfterGaunt, statsAfterHelm, gauntSoA.stats, gauntIdx * 6);
      } else {
        addItemStatsRolled(statsAfterGaunt, statsAfterHelm, gauntSoA.stats, gauntIdx * 6);
      }
      if (
        useSubtreePrune &&
        canPruneSubtree(
          maxStatsAfterGaunt,
          minStatsAfterGaunt,
          artificeAfterGaunt,
          maxTotalAfterGaunt,
          statsAfterGaunt,
          artificeP2,
        )
      ) {
        skipLowTier += combosPerGaunt;
        skipSubtree += combosPerGaunt;
        comboCount += combosPerGaunt;
        if (comboCount >= 100000) {
          await flushProgress();
        }
        continue;
      }
      for (let chestIdx = 0; chestIdx < chests.length; chestIdx++) {
        const chest = chests[chestIdx];
        const exoticP3 = exoticP2 + chestSoA.exotic[chestIdx];
        if (useCoarseLevelPrunes && exoticP3 > 1) {
          skipDoubleExotic += combosPerChest;
          comboCount += combosPerChest;
          if (comboCount >= 100000) {
            await flushProgress();
          }
          continue;
        }
        if (useCoarseLevelPrunes && anyExotic && exoticP3 === 0 && !exoticAfterChest) {
          skipNoExotic += combosPerChest;
          comboCount += combosPerChest;
          if (comboCount >= 100000) {
            await flushProgress();
          }
          continue;
        }
        if (
          hasPerkReqs &&
          perkCountsPrune(
            chestSoA,
            chestIdx,
            perksAfterGaunt,
            perksAfterChest,
            maxPerksAfterChest,
            requiredPerkCounts,
          ) &&
          useCoarseLevelPrunes
        ) {
          skipInsufficientPerks += combosPerChest;
          comboCount += combosPerChest;
          if (comboCount >= 100000) {
            await flushProgress();
          }
          continue;
        }
        const wildcardP3 = wildcardP2 + chestSoA.wildcard[chestIdx];
        if (
          numSetBonuses > 0 &&
          setBonusPrune(
            chestSoA,
            chestIdx,
            setCountsAfterGaunt,
            setCountsAfterChest,
            setBonusCounts,
            wildcardP3,
            maxSetContribAfterChest,
          ) &&
          useCoarseLevelPrunes
        ) {
          skipInsufficientSetBonus += combosPerChest;
          comboCount += combosPerChest;
          if (comboCount >= 100000) {
            await flushProgress();
          }
          continue;
        }
        const artificeP3 = artificeP2 + chestSoA.artifice[chestIdx];
        if (useUnrolledAdds) {
          addItemStats(statsAfterChest, statsAfterGaunt, chestSoA.stats, chestIdx * 6);
        } else {
          addItemStatsRolled(statsAfterChest, statsAfterGaunt, chestSoA.stats, chestIdx * 6);
        }
        if (
          useSubtreePrune &&
          canPruneSubtree(
            maxStatsAfterChest,
            minStatsAfterChest,
            artificeAfterChest,
            maxTotalAfterChest,
            statsAfterChest,
            artificeP3,
          )
        ) {
          skipLowTier += combosPerChest;
          skipSubtree += combosPerChest;
          comboCount += combosPerChest;
          if (comboCount >= 100000) {
            await flushProgress();
          }
          continue;
        }
        for (let legIdx = 0; legIdx < legs.length; legIdx++) {
          const leg = legs[legIdx];
          const exoticP4 = exoticP3 + legSoA.exotic[legIdx];
          if (useCoarseLevelPrunes && exoticP4 > 1) {
            skipDoubleExotic += combosPerLeg;
            comboCount += combosPerLeg;
            if (comboCount >= 100000) {
              await flushProgress();
            }
            continue;
          }
          if (useCoarseLevelPrunes && anyExotic && exoticP4 === 0 && !exoticAfterLeg) {
            skipNoExotic += combosPerLeg;
            comboCount += combosPerLeg;
            if (comboCount >= 100000) {
              await flushProgress();
            }
            continue;
          }
          if (
            hasPerkReqs &&
            perkCountsPrune(
              legSoA,
              legIdx,
              perksAfterChest,
              perksAfterLeg,
              maxPerksAfterLeg,
              requiredPerkCounts,
            ) &&
            useCoarseLevelPrunes
          ) {
            skipInsufficientPerks += combosPerLeg;
            comboCount += combosPerLeg;
            if (comboCount >= 100000) {
              await flushProgress();
            }
            continue;
          }
          const wildcardP4 = wildcardP3 + legSoA.wildcard[legIdx];
          if (
            numSetBonuses > 0 &&
            setBonusPrune(
              legSoA,
              legIdx,
              setCountsAfterChest,
              setCountsAfterLeg,
              setBonusCounts,
              wildcardP4,
              maxSetContribAfterLeg,
            ) &&
            useCoarseLevelPrunes
          ) {
            skipInsufficientSetBonus += combosPerLeg;
            comboCount += combosPerLeg;
            if (comboCount >= 100000) {
              await flushProgress();
            }
            continue;
          }
          const artificeP4 = artificeP3 + legSoA.artifice[legIdx];
          if (useUnrolledAdds) {
            addItemStats(statsAfterLeg, statsAfterChest, legSoA.stats, legIdx * 6);
          } else {
            addItemStatsRolled(statsAfterLeg, statsAfterChest, legSoA.stats, legIdx * 6);
          }
          if (
            useSubtreePrune &&
            canPruneSubtree(
              maxStatsAfterLeg,
              minStatsAfterLeg,
              artificeAfterLeg,
              maxTotalAfterLeg,
              statsAfterLeg,
              artificeP4,
            )
          ) {
            skipLowTier += combosPerLeg;
            skipSubtree += combosPerLeg;
            comboCount += combosPerLeg;
            if (comboCount >= 100000) {
              await flushProgress();
            }
            continue;
          }
          innerloop: for (let classItemIdx = 0; classItemIdx < classItems.length; classItemIdx++) {
            comboCount++;
            if (comboCount >= 100000) {
              await flushProgress();
            }

            // Check exotic constraints
            const exoticSum = exoticP4 + classItemSoA.exotic[classItemIdx];
            if (exoticSum > 1) {
              skipDoubleExotic++;
              continue;
            }
            if (anyExotic && exoticSum === 0) {
              skipNoExotic++;
              continue;
            }

            // Check required perk counts across the set
            if (hasPerkReqs) {
              const ciPerkBase = classItemIdx * numPerks;
              for (let i = 0; i < numPerks; i++) {
                const actualCount = perksAfterLeg[i] + classItemSoA.perks[ciPerkBase + i];
                if (actualCount < requiredPerkCounts[i]) {
                  skipInsufficientPerks++;
                  continue innerloop;
                }
              }
            }

            // Set bonuses; each slot can use one wildcard if present
            if (numSetBonuses > 0) {
              const classItemSet = classItemSoA.setBonusIdx[classItemIdx];
              let wildcardsRemaining = wildcardP4 + classItemSoA.wildcard[classItemIdx];
              for (let i = 0; i < numSetBonuses; i++) {
                const setNeededCount = setBonusCounts[i];
                const setCount = setCountsAfterLeg[i] + (classItemSet === i ? 1 : 0);
                if (setCount < setNeededCount) {
                  const wildcardsNeeded = setNeededCount - setCount;
                  if (wildcardsRemaining >= wildcardsNeeded) {
                    wildcardsRemaining -= wildcardsNeeded;
                  } else {
                    skipInsufficientSetBonus++;
                    continue innerloop;
                  }
                }
              }
            }

            const ciBase = classItemIdx * 6;

            // At most one item in a valid set carries tuning variants (only
            // exotics do, and double exotics were pruned above). Each variant
            // is evaluated below as its own candidate set, sharing all the
            // loop-level work and the per-set energy cache.
            let tuningInfo = helmSoA.tuning[helmIdx];
            let tuningSlot = 0;
            if (tuningInfo === undefined) {
              tuningInfo = gauntSoA.tuning[gauntIdx];
              tuningSlot = 1;
            }
            if (tuningInfo === undefined) {
              tuningInfo = chestSoA.tuning[chestIdx];
              tuningSlot = 2;
            }
            if (tuningInfo === undefined) {
              tuningInfo = legSoA.tuning[legIdx];
              tuningSlot = 3;
            }
            if (tuningInfo === undefined) {
              tuningInfo = classItemSoA.tuning[classItemIdx];
              tuningSlot = 4;
            }
            const tuningVariants = tuningInfo?.variants;
            const numVariants = tuningVariants !== undefined ? tuningVariants.length : 1;

            const classItem = classItems[classItemIdx];
            armor[0] = helm;
            armor[1] = gaunt;
            armor[2] = chest;
            armor[3] = leg;
            armor[4] = classItem;
            // The energy profile doesn't depend on tuning, so the cache is
            // shared across all variants of this armor set.
            energyCache.result = undefined;

            const numArtifice = artificeP4 + classItemSoA.artifice[classItemIdx];

            // The most total stat points we could get from mods, assuming
            // everything was perfectly assignable.
            const maxModBonus = numArtifice * artificeStatBoost + generalModsBonus;

            if (useTuningPreGate && tuningInfo !== undefined) {
              // Almost all sets die at the couldInsert prune, and paying the
              // per-variant arithmetic for each of them adds up, so decide
              // once per set whether any variant could matter. Stat-range
              // minimums are updated here with the per-stat minimum across
              // variants, which matches what the per-variant updates would
              // produce; the convergence gate and heap bound use per-stat/
              // per-variant maximums, so this only skips variants that could
              // neither improve the displayed ranges nor make the top sets.
              const { minDeltas, maxDeltas, maxNetGain } = tuningInfo;
              if (useUnrolledAdds) {
                addItemStats(stats, statsAfterLeg, classItemSoA.stats, ciBase);
              } else {
                addItemStatsRolled(stats, statsAfterLeg, classItemSoA.stats, ciBase);
              }
              let totalBase = 0;
              let mayMatter = false;
              for (let index = 0; index < 6; index++) {
                const filter = desiredStatRanges[index];
                const statRange = statRanges[index];
                if (filter.maxStat > 0 /* non-ignored stat */) {
                  const minValue = Math.min(stats[index] + minDeltas[index], filter.maxStat);
                  if (minValue < statRange.minStat) {
                    statRange.minStat = minValue;
                  }
                  totalBase += Math.min(stats[index], filter.maxStat);
                }
                const maxSeen = statRange.maxStat;
                const bestValue = stats[index] + maxDeltas[index];
                if (
                  maxSeen < filter.minStat ||
                  bestValue > maxSeen ||
                  (maxSeen < MAX_STAT && bestValue + maxModBonus > maxSeen)
                ) {
                  mayMatter = true;
                }
              }
              if (!mayMatter && !setTracker.couldInsert(totalBase + maxNetGain + maxModBonus)) {
                numProcessed += numVariants;
                skipLowTier += numVariants;
                skipTuningGate += numVariants;
                continue;
              }
            }

            for (let variantIdx = 0; variantIdx < numVariants; variantIdx++) {
              numProcessed++;

              // Add the class item's stats onto the outer levels' running
              // partial sums to form the overall set stats.
              // Note that mod stats could theoretically take these negative, but
              // none do in practice.
              if (useUnrolledAdds) {
                addItemStats(stats, statsAfterLeg, classItemSoA.stats, ciBase);
              } else {
                addItemStatsRolled(stats, statsAfterLeg, classItemSoA.stats, ciBase);
              }
              if (tuningVariants !== undefined) {
                const deltas = tuningVariants[variantIdx].deltas;
                stats[0] += deltas[0];
                stats[1] += deltas[1];
                stats[2] += deltas[2];
                stats[3] += deltas[3];
                stats[4] += deltas[4];
                stats[5] += deltas[5];
              }

              // A version of the set stats that have been clamped to the max stat
              // constraint.
              effectiveStats[0] = Math.min(stats[0], maxStatConstraints[0]);
              effectiveStats[1] = Math.min(stats[1], maxStatConstraints[1]);
              effectiveStats[2] = Math.min(stats[2], maxStatConstraints[2]);
              effectiveStats[3] = Math.min(stats[3], maxStatConstraints[3]);
              effectiveStats[4] = Math.min(stats[4], maxStatConstraints[4]);
              effectiveStats[5] = Math.min(stats[5], maxStatConstraints[5]);

              // neededStats is the extra stats we'd need in each stat in order to
              // hit the stat minimums, and totalNeededStats is just the sum of
              // those. This informs the logic for deciding how to add stat mods.
              neededStats[0] = 0;
              neededStats[1] = 0;
              neededStats[2] = 0;
              neededStats[3] = 0;
              neededStats[4] = 0;
              neededStats[5] = 0;
              let totalNeededStats = 0;

              // Check which stats we're under the stat minimums on.
              let totalStats = 0;
              for (let index = 0; index < 6; index++) {
                const filter = desiredStatRanges[index];
                if (filter.maxStat > 0 /* non-ignored stat */) {
                  const value = effectiveStats[index];
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

              // Check to see if it would be at all possible to hit the needed
              // stat total with the best case mod bonuses. If totalNeededStats is
              // 0 this passes trivially.
              lowerBoundsChecked++;
              if (totalNeededStats > maxModBonus) {
                lowerBoundsFailed++;
                continue;
              }

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
              //
              // updateMaxStats only ever raises the running maxes, so once they
              // have converged (the common steady state in large searches) we can
              // skip the call for sets that provably can't raise any of them.
              // These conditions mirror its internal update conditions exactly.
              let mayImproveMax = !useConvergenceGate;
              if (useConvergenceGate) {
                for (let index = 0; index < 6; index++) {
                  const maxSeen = statRanges[index].maxStat;
                  if (
                    maxSeen < desiredStatRanges[index].minStat ||
                    stats[index] > maxSeen ||
                    (maxSeen < MAX_STAT && stats[index] + maxModBonus > maxSeen)
                  ) {
                    mayImproveMax = true;
                    break;
                  }
                }
              }
              const foundAnyImprovement =
                mayImproveMax &&
                updateMaxStats(
                  precalculatedInfo,
                  armor,
                  stats,
                  numArtifice,
                  desiredStatRanges,
                  statRanges,
                  useEnergyCache ? energyCache : undefined,
                );

              // Drop this set if it could never make it into our top
              // RETURNED_ARMOR_SETS sets. We do this only after confirming that
              // any required stat mods fit and updating our max tiers so that the
              // max available tier info stays accurate.
              if (!setTracker.couldInsert(totalStats + maxModBonus)) {
                skipLowTier++;
                skipTrackerFloor++;
                continue;
              }

              const optimalResult = pickOptimalStatMods(
                precalculatedInfo,
                armor,
                stats,
                desiredStatRanges,
                numArtifice,
                useEnergyCache ? energyCache : undefined,
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
                skipLowTier++;
                skipTrackerFloor++;
                continue;
              }

              // Calculate the numeric stat mix for fast integer comparison.
              // This encodes each stat value (0-200) into 8 bits, packed into a single integer.
              // Only non-ignored stats are included, maintaining lexical ordering for priority.
              const numericStatMix = encodeStatMix(finalStats, desiredStatRanges);

              // Add on any tuning mods, preset on the items or chosen for the
              // tunable item.
              // It's important that we keep the order of these tuning mods in
              // the order of the armor (even when we assign mods dynamically,
              // later), so that when we assign them in fitMostMods they get
              // assigned to the same item. Otherwise, we could end up swapping
              // between one balanced mod and one tuning mod, and the balanced
              // mod's stat bonuses could be slightly different.
              const tuningMods = [
                helm.includedTuningMod,
                gaunt.includedTuningMod,
                chest.includedTuningMod,
                leg.includedTuningMod,
                classItem.includedTuningMod,
              ];
              if (tuningVariants !== undefined) {
                tuningMods[tuningSlot] = tuningVariants[variantIdx].modHash;
              }
              mods.push(...compact(tuningMods));

              processStatistics.numValidSets++;
              // And now insert our set using the predicted total tier and numeric stat mix.
              setTracker.insert({
                enabledStatsTotal: finalTotalStats,
                statMix: numericStatMix,
                power: getPower(armor),
                // Copy the reused scratch arrays since the tracker retains them.
                armor: armor.slice(),
                stats: stats.slice(),
                statsTotal: sum(stats),
                mods,
                bonusStats,
                // The chosen variant's deltas, so the final mapping can report
                // the tuned item's armor-only stats.
                tuningDeltas:
                  tuningVariants !== undefined ? tuningVariants[variantIdx].deltas : undefined,
              });

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

  // Flush the local hot counters into the statistics objects. This also runs
  // when stopOnFirstSet breaks out of the loop early.
  processStatistics.numProcessed += numProcessed;
  setStatistics.lowerBoundsExceeded.timesChecked += lowerBoundsChecked;
  setStatistics.lowerBoundsExceeded.timesFailed += lowerBoundsFailed;
  setStatistics.skipReasons.doubleExotic += skipDoubleExotic;
  setStatistics.skipReasons.noExotic += skipNoExotic;
  setStatistics.skipReasons.insufficientPerks += skipInsufficientPerks;
  setStatistics.skipReasons.insufficientSetBonus += skipInsufficientSetBonus;
  setStatistics.skipReasons.skippedLowTier += skipLowTier;
  setStatistics.skipReasons.subtreePruned! += skipSubtree;
  setStatistics.skipReasons.tuningGatePruned! += skipTuningGate;
  setStatistics.skipReasons.trackerFloorPruned! += skipTrackerFloor;

  const finalSets = setTracker.getArmorSets();

  const sets = filterMap(finalSets, ({ armor, stats, mods, bonusStats, tuningDeltas, ...rest }) => {
    const armorOnlyStats: Partial<ArmorStats> = {};
    const fullStats: Partial<ArmorStats> = {};

    let hasStrictUpgrade = false;

    const helmStats = statsCache.get(armor[0])!;
    const gauntStats = statsCache.get(armor[1])!;
    const chestStats = statsCache.get(armor[2])!;
    const legStats = statsCache.get(armor[3])!;
    const classItemStats = statsCache.get(armor[4])!;

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
        hasStrictUpgrade ||= value > statFilter.minStat;
      }

      // statsCache holds the tunable item's base stats, so add the chosen
      // tuning mod's contribution back in.
      armorOnlyStats[statHash] =
        helmStats[i] +
        gauntStats[i] +
        chestStats[i] +
        legStats[i] +
        classItemStats[i] +
        (tuningDeltas !== undefined ? tuningDeltas[i] : 0);
    }

    if (strictUpgrades && !hasStrictUpgrade) {
      return undefined;
    }

    return {
      ...rest,
      armor: armor.map((item) => item.id),
      stats: fullStats as ArmorStats,
      armorStats: armorOnlyStats as ArmorStats,
      statMods: mods,
    };
  });

  const totalTime = performance.now() - pstart;

  infoLog(
    `loadout optimizer thread ${workerNum}`,
    'found',
    processStatistics.numValidSets,
    'stat mixes after processing',
    combos,
    'stat combinations in',
    totalTime,
    'ms - ',
    Math.floor((combos * 1000) / totalTime),
    'combos/s',
    // Stringified because these workers get terminated when the run ends, and
    // DevTools can't inspect live objects logged from a dead worker.
    'sets outright skipped:',
    JSON.stringify(setStatistics.skipReasons),
    'lower bounds:',
    JSON.stringify(setStatistics.lowerBoundsExceeded),
    'mod assignment stats:',
    'early check:',
    JSON.stringify(setStatistics.modsStatistics.earlyModsCheck),
    'auto mods pick:',
    JSON.stringify(setStatistics.modsStatistics.autoModsPick),
    'final assignment:',
    JSON.stringify(setStatistics.modsStatistics.finalAssignment),
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

/**
 * Structure-of-arrays view of a bucket's items: flat 0/1 flags, stat values,
 * and perk counts so the hot loop reads contiguous numbers instead of chasing
 * object properties or hashing into maps.
 */
interface BucketSoA {
  exotic: Int8Array;
  artifice: Int8Array;
  /** 1 if the item's set bonus socket lets it wildcard a requested set. */
  wildcard: Int8Array;
  /** n*6 item stats in stat priority order. */
  stats: Int32Array;
  /** Index of the item's set bonus in setBonusHashes, or -1. */
  setBonusIdx: Int8Array;
  /** n*numPerks 0/1 counts of the required perks. */
  perks: Int8Array;
  /** Whether any item in this bucket is exotic. */
  hasExotic: boolean;
  /** For each required perk, the best contribution any item in this bucket can make (0/1). */
  maxPerks: Int8Array;
  /** The best set-bonus deficit reduction any item in this bucket can make (set piece + wildcard). */
  maxSetContrib: number;
  /**
   * Per item, the candidate tuning mods with their stat deltas in stat
   * priority order, or undefined. Only exotics carry these; the tail resolves
   * the choice per set instead of the loop enumerating variants.
   */
  tuning: (TuningBucketEntry | undefined)[];
}

interface TuningVariant {
  modHash: number;
  /** Tuned stats minus base stats, in stat priority order. */
  deltas: number[];
}

interface TuningBucketEntry {
  variants: TuningVariant[];
  /** Per stat, the lowest delta across the variants (for exact stat-range minimums). */
  minDeltas: number[];
  /** Per stat, the highest delta across the variants (for the max-range convergence gate). */
  maxDeltas: number[];
  /** The best net gain any variant can add to the enabled-stat total. */
  maxNetGain: number;
}

function buildBucketSoA(
  items: ProcessItem[],
  statsCache: Map<ProcessItem, number[]>,
  setBonusHashes: number[],
  perkHashes: number[],
  statOrder: number[],
  desiredStatRanges: DesiredStatRange[],
): BucketSoA {
  const n = items.length;
  const numPerks = perkHashes.length;
  const soa: BucketSoA = {
    exotic: new Int8Array(n),
    artifice: new Int8Array(n),
    wildcard: new Int8Array(n),
    stats: new Int32Array(n * 6),
    setBonusIdx: new Int8Array(n),
    perks: new Int8Array(n * numPerks),
    hasExotic: false,
    maxPerks: new Int8Array(numPerks),
    maxSetContrib: 0,
    tuning: new Array<TuningBucketEntry | undefined>(n),
  };
  for (let i = 0; i < n; i++) {
    const item = items[i];
    soa.exotic[i] = item.isExotic ? 1 : 0;
    if (item.tuningVariants?.length) {
      const variants = item.tuningVariants.map((v) => ({
        modHash: v.modHash,
        deltas: statOrder.map((statHash) => v.stats[statHash] - item.stats[statHash]),
      }));
      const minDeltas = [0, 0, 0, 0, 0, 0];
      const maxDeltas = [0, 0, 0, 0, 0, 0];
      let maxNetGain = 0;
      for (let s = 0; s < 6; s++) {
        minDeltas[s] = Math.min(...variants.map((v) => v.deltas[s]));
        maxDeltas[s] = Math.max(...variants.map((v) => v.deltas[s]));
      }
      for (const v of variants) {
        let netGain = 0;
        for (let s = 0; s < 6; s++) {
          if (desiredStatRanges[s].maxStat > 0 && v.deltas[s] > 0) {
            netGain += v.deltas[s];
          }
        }
        if (netGain > maxNetGain) {
          maxNetGain = netGain;
        }
      }
      soa.tuning[i] = { variants, minDeltas, maxDeltas, maxNetGain };
    }
    soa.artifice[i] = item.isArtifice ? 1 : 0;
    soa.wildcard[i] = item.hasSetBonusModSocket ? 1 : 0;
    soa.setBonusIdx[i] = item.setBonus !== undefined ? setBonusHashes.indexOf(item.setBonus) : -1;
    soa.hasExotic ||= item.isExotic;
    const setContrib = (soa.setBonusIdx[i] >= 0 ? 1 : 0) + soa.wildcard[i];
    if (setContrib > soa.maxSetContrib) {
      soa.maxSetContrib = setContrib;
    }
    const stats = statsCache.get(item)!;
    for (let s = 0; s < 6; s++) {
      soa.stats[i * 6 + s] = stats[s];
    }
    for (let p = 0; p < numPerks; p++) {
      if (item.intrinsicPerks?.includes(perkHashes[p])) {
        soa.perks[i * numPerks + p] = 1;
        soa.maxPerks[p] = 1;
      }
    }
  }
  return soa;
}

interface Scheduler {
  scheduler?: { yield: () => Promise<void> };
}

/**
 * Unlike Chrome, Firefox won't deliver postMessage until the thread yields.
 * This relatively new API lets us yield periodically without restructuring the
 * enumeration loop.
 */
function makeYieldTask(): (() => Promise<void>) | undefined {
  if ((globalThis as unknown as Scheduler).scheduler && navigator.userAgent.includes('Firefox')) {
    return () => (globalThis as unknown as Scheduler).scheduler!.yield();
  }
}

/** Element-wise sum of two 6-stat vectors. */
function addVectors(a: number[], b: number[]): number[] {
  const out = [0, 0, 0, 0, 0, 0];
  for (let s = 0; s < 6; s++) {
    out[s] = a[s] + b[s];
  }
  return out;
}

/**
 * out[s] = partial[s] + itemStats[base + s] for all six stats. Manually
 * unrolled: engines don't unroll this automatically and it makes a big
 * difference in speed in the hot loop.
 */
function addItemStats(out: number[], partial: number[], itemStats: Int32Array, base: number) {
  out[0] = partial[0] + itemStats[base];
  out[1] = partial[1] + itemStats[base + 1];
  out[2] = partial[2] + itemStats[base + 2];
  out[3] = partial[3] + itemStats[base + 3];
  out[4] = partial[4] + itemStats[base + 4];
  out[5] = partial[5] + itemStats[base + 5];
}

/** Ablation bench: the rolled-loop equivalent of addItemStats. */
function addItemStatsRolled(out: number[], partial: number[], itemStats: Int32Array, base: number) {
  for (let s = 0; s < 6; s++) {
    out[s] = partial[s] + itemStats[base + s];
  }
}

/** Bounds on what one bucket's items can contribute, for subtree pruning. */
interface BucketStatBounds {
  /** The highest base value each stat can get from this bucket. */
  max: number[];
  /** The lowest base value each stat can get from this bucket. */
  min: number[];
  /** Whether the bucket has an artifice item (worth one artifice mod). */
  hasArtifice: boolean;
  /**
   * The single highest enabled-stat total any one item reaches — a tighter
   * upper bound than summing the per-stat maxes (which come from different,
   * stat-specialized items no single completion can combine).
   */
  maxTotal: number;
}

function computeBucketStatBounds(
  soa: BucketSoA,
  n: number,
  maxStatConstraints: number[],
): BucketStatBounds {
  const max = [0, 0, 0, 0, 0, 0];
  const min = [MAX_STAT, MAX_STAT, MAX_STAT, MAX_STAT, MAX_STAT, MAX_STAT];
  let hasArtifice = false;
  let maxTotal = 0;
  for (let i = 0; i < n; i++) {
    const b = i * 6;
    let itemTotal = 0;
    for (let s = 0; s < 6; s++) {
      const v = soa.stats[b + s];
      if (v > max[s]) {
        max[s] = v;
      }
      if (v < min[s]) {
        min[s] = v;
      }
      if (maxStatConstraints[s] > 0) {
        itemTotal += v;
      }
    }
    if (itemTotal > maxTotal) {
      maxTotal = itemTotal;
    }
    hasArtifice ||= soa.artifice[i] === 1;
  }
  return { max, min, hasArtifice, maxTotal };
}

/**
 * Global headroom for exotic tuning deltas. Legendary tuning is already baked
 * into each item's stats (the mapper expands a tunable legendary into one item
 * per tuning mod), so the base-stat bounds already cover it. Exotics instead
 * defer their tuning choice to the tail via tuningVariants, and a valid set
 * has at most one exotic — so a single global headroom (the best/worst delta
 * any exotic variant offers) keeps the bounds valid whichever exotic ends up
 * tuning.
 */
function computeTuningDeltaBounds(soas: BucketSoA[]) {
  const maxTuningDelta = [0, 0, 0, 0, 0, 0];
  const minTuningDelta = [0, 0, 0, 0, 0, 0];
  let maxTuningNetGain = 0;
  for (const soa of soas) {
    for (const entry of soa.tuning) {
      if (entry) {
        for (let s = 0; s < 6; s++) {
          if (entry.maxDeltas[s] > maxTuningDelta[s]) {
            maxTuningDelta[s] = entry.maxDeltas[s];
          }
          if (entry.minDeltas[s] < minTuningDelta[s]) {
            minTuningDelta[s] = entry.minDeltas[s];
          }
        }
        if (entry.maxNetGain > maxTuningNetGain) {
          maxTuningNetGain = entry.maxNetGain;
        }
      }
    }
  }
  return { maxTuningDelta, minTuningDelta, maxTuningNetGain };
}

/**
 * Accumulate one item's required-perk counts on top of the previous levels'
 * running counts, writing the result to `outCounts`. Returns true when some
 * perk can't reach its required count even with the best contribution of every
 * remaining bucket, so the whole subtree can be skipped. (On a prune,
 * `outCounts` may be left partially updated.)
 */
function perkCountsPrune(
  soa: BucketSoA,
  itemIdx: number,
  prevCounts: number[],
  outCounts: number[],
  maxPerksAfter: number[],
  requiredPerkCounts: number[],
): boolean {
  const numPerks = requiredPerkCounts.length;
  const base = itemIdx * numPerks;
  // Always fills all counts (no early exit) so the ablation config that
  // ignores the verdict still gets correct running counts for deeper levels.
  let impossible = false;
  for (let i = 0; i < numPerks; i++) {
    const p = prevCounts[i] + soa.perks[base + i];
    outCounts[i] = p;
    if (p + maxPerksAfter[i] < requiredPerkCounts[i]) {
      impossible = true;
    }
  }
  return impossible;
}

/**
 * Accumulate one item's set-bonus piece counts on top of the previous levels'
 * running counts, writing the result to `outCounts`. Returns true when the
 * remaining deficit, less this partial set's wildcard sockets, exceeds what the
 * remaining buckets could contribute, so the subtree can be skipped.
 */
function setBonusPrune(
  soa: BucketSoA,
  itemIdx: number,
  prevCounts: number[],
  outCounts: number[],
  setBonusCounts: number[],
  wildcards: number,
  maxSetContribAfter: number,
): boolean {
  const setIdx = soa.setBonusIdx[itemIdx];
  let deficit = 0;
  for (let i = 0; i < setBonusCounts.length; i++) {
    const c = prevCounts[i] + (setIdx === i ? 1 : 0);
    outCounts[i] = c;
    const d = setBonusCounts[i] - c;
    if (d > 0) {
      deficit += d;
    }
  }
  return deficit - wildcards > maxSetContribAfter;
}

/**
 * Seed exact stat ranges up front. When the search spans every combination —
 * no exotic/perk/set-bonus requirement couples the buckets and every set is
 * valid — the exact min and max ranges can be computed directly instead of by
 * visiting every set: each stat's minimum is the summed lowest per-bucket
 * contribution, and its maximum is what the mod solver reaches on the set that
 * maximizes it. Correctness never depends on the seed (the loop's bounds still
 * compute the true ranges) — only speed: the min seed is exact, and the max
 * seed is a guaranteed-achievable lower bound the loop refines upward.
 *
 * minStat is tracked over every coarsely-valid set, so its floor over sets
 * with at most one exotic is exact. maxStat is tracked only over sets that
 * meet the stat minimums, so each candidate max set is put through the same
 * mod gate the main loop uses and seeds the max only if it meets them
 * (trivially true when there are no minimums).
 */
function seedExactStatRanges(
  soas: BucketSoA[],
  buckets: ProcessItem[][],
  statsCache: Map<ProcessItem, number[]>,
  modStatsInStatOrder: number[],
  maxStatConstraints: number[],
  desiredStatRanges: DesiredStatRange[],
  statRanges: MinMaxStat[],
  precalculatedInfo: LoSessionInfo,
  hasMods: boolean,
  modsStatistics: ModAssignmentStatistics,
): void {
  const generalModsBonus = precalculatedInfo.numAvailableGeneralMods * majorStatBoost;
  for (let i = 0; i < 6; i++) {
    if (maxStatConstraints[i] === 0) {
      continue;
    }
    // The floor must respect the one-exotic rule: summing unconstrained
    // per-bucket minimums can combine two exotics into a "set" the loop skips
    // as double-exotic, seeding a minimum no real set reaches. Take each
    // bucket's non-exotic minimum, then allow the single best exotic swap.
    // Exotic minimums include their worst tuning delta, matching how the tail
    // lowers minStat. (Legendary tuning is already in the base stats.)
    let floor = modStatsInStatOrder[i];
    let bestSwap = Infinity;
    let forcedExotics = 0;
    for (let b = 0; b < 5; b++) {
      const soa = soas[b];
      const n = buckets[b].length;
      let minNonExotic = Infinity;
      let minExotic = Infinity;
      for (let k = 0; k < n; k++) {
        const entry = soa.tuning[k];
        const v = soa.stats[k * 6 + i] + (entry ? entry.minDeltas[i] : 0);
        if (soa.exotic[k] === 1) {
          if (v < minExotic) {
            minExotic = v;
          }
        } else if (v < minNonExotic) {
          minNonExotic = v;
        }
      }
      if (minNonExotic === Infinity) {
        // The bucket only has exotics, so it must supply the set's one exotic.
        forcedExotics++;
        floor += minExotic;
      } else {
        floor += minNonExotic;
        if (minExotic - minNonExotic < bestSwap) {
          bestSwap = minExotic - minNonExotic;
        }
      }
    }
    if (forcedExotics > 1) {
      // Every completion is a double exotic; there are no valid sets to seed.
      continue;
    }
    if (forcedExotics === 0 && bestSwap < 0) {
      floor += bestSwap;
    }
    const clamped = Math.min(floor, maxStatConstraints[i]);
    if (clamped < statRanges[i].minStat) {
      statRanges[i].minStat = clamped;
    }
  }
  const armor = new Array<ProcessItem>(5);
  const stats = [0, 0, 0, 0, 0, 0];
  const neededStats = [0, 0, 0, 0, 0, 0];
  const energyCache: SetEnergyCache = { result: undefined };
  for (let i = 0; i < 6; i++) {
    if (maxStatConstraints[i] === 0) {
      continue;
    }
    // Build the stat-i-maximizing set, keeping at most one exotic so it's a
    // real valid set (else its max would overstate what's achievable).
    let exoticUsed = false;
    let valid = true;
    for (let b = 0; b < 5; b++) {
      const soa = soas[b];
      const items = buckets[b];
      let bestIdx = 0;
      let bestVal = -1;
      let bestNonExoticIdx = -1;
      let bestNonExoticVal = -1;
      for (let k = 0; k < items.length; k++) {
        const v = soa.stats[k * 6 + i];
        if (v > bestVal) {
          bestVal = v;
          bestIdx = k;
        }
        if (soa.exotic[k] === 0 && v > bestNonExoticVal) {
          bestNonExoticVal = v;
          bestNonExoticIdx = k;
        }
      }
      let pick = bestIdx;
      if (soa.exotic[bestIdx] === 1) {
        if (exoticUsed) {
          if (bestNonExoticIdx >= 0) {
            pick = bestNonExoticIdx;
          } else {
            valid = false;
            break;
          }
        } else {
          exoticUsed = true;
        }
      }
      armor[b] = items[pick];
    }
    if (!valid) {
      continue;
    }
    let numArtifice = 0;
    for (let s = 0; s < 6; s++) {
      stats[s] = modStatsInStatOrder[s];
    }
    for (let b = 0; b < 5; b++) {
      const itStats = statsCache.get(armor[b])!;
      for (let s = 0; s < 6; s++) {
        stats[s] += itStats[s];
      }
      if (armor[b].isArtifice) {
        numArtifice++;
      }
    }
    // Put the candidate through the main loop's mod gate: it contributes to
    // maxStat only if it can fit mods to meet the stat minimums.
    let totalNeededStats = 0;
    for (let s = 0; s < 6; s++) {
      neededStats[s] = 0;
      const filter = desiredStatRanges[s];
      if (filter.maxStat > 0 && filter.minStat > 0) {
        const need = filter.minStat - Math.min(stats[s], maxStatConstraints[s]);
        if (need > 0) {
          totalNeededStats += need;
          neededStats[s] = need;
        }
      }
    }
    const maxModBonus = numArtifice * artificeStatBoost + generalModsBonus;
    if (totalNeededStats > maxModBonus) {
      continue;
    }
    energyCache.result = undefined;
    if (
      (hasMods || totalNeededStats > 0) &&
      !pickAndAssignSlotIndependentMods(
        precalculatedInfo,
        modsStatistics,
        armor,
        totalNeededStats > 0 ? neededStats : undefined,
        numArtifice,
      )
    ) {
      continue;
    }
    updateMaxStats(
      precalculatedInfo,
      armor,
      stats,
      numArtifice,
      desiredStatRanges,
      statRanges,
      energyCache,
    );
  }
}
