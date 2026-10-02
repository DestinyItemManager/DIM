import { sumBy } from 'app/utils/collections';
import { maxBy } from 'es-toolkit';
import { ArmorStatHashes, ArmorStats, DesiredStatRange } from '../types';
import {
  AcquisitionPlan,
  HypotheticalArmorBlock,
  HypotheticalPlan,
  MAX_ENERGY,
  MAX_SEARCH_BLOCKS,
  planMinimumAcquisitions,
  PlannerAutoModCosts,
  PlannerOwnedPiece,
  SetBonusRequirement,
} from './hypothetical-items';

/**
 * The full planning orchestration for the stat-target planner, as one pure
 * function over structured-cloneable data so it can run in a web worker.
 * All manifest-dependent work (item mapping, exotic bucket lookup, display
 * names) happens on the main thread before building PlannerInputs.
 */

/**
 * How many owned candidates to consider per slot (plus set-bonus pieces).
 * Candidates are tuning variants, not items, and the owned search is
 * O(candidates^slots) — so raising this trades run time for the number of
 * distinct items that survive alongside their variants.
 */
const OWNED_PER_SLOT = 12;
/** How many extra set-bonus candidates to consider per slot per required set. */
const OWNED_PER_SLOT_PER_SET = 4;

/**
 * A candidate owned piece, referencing its DimItem only by id. One DimItem
 * yields several pieces when its tuning slot has more than one option, so `id`
 * identifies the variant and `itemId` the underlying item.
 */
export interface PlannerPiece extends PlannerOwnedPiece {
  id: string;
  itemId: string;
  isExotic: boolean;
}

/** How many pieces a plan asks you to farm in total. */
export function totalFarmCount(farm: { count: number }[]) {
  return sumBy(farm, ({ count }) => count);
}

export type PlannerExoticMode =
  /** No exotic constraint. */
  | { type: 'none' }
  /** The set must include one exotic ("Any Exotic"). */
  | { type: 'any' }
  /** A specific exotic is locked; it lives in this slot (ArmorBucketHashes index). */
  | { type: 'locked'; bucketIndex: number };

export interface PlannerInputs {
  blocks: HypotheticalArmorBlock[];
  desiredStatRanges: DesiredStatRange[];
  /** Stat contributions (mods, subclass) that apply regardless of armor. */
  modStatTotals: ArmorStats;
  /** All candidate pieces per slot, in ArmorBucketHashes order. */
  piecesByBucket: PlannerPiece[][];
  /** Pinned item id per slot (ArmorBucketHashes order), if any. */
  pinnedIds: (string | undefined)[];
  exoticMode: PlannerExoticMode;
  /** Keep owned armor (minimize farming) vs. plan ideal drops everywhere. */
  keepOwned: boolean;
  setBonusRequirements: SetBonusRequirement[];
  /** General sockets available for auto stat mods. */
  numGeneralMods: number;
  autoModCosts?: PlannerAutoModCosts;
  /** Energy costs of user-locked general mods. */
  lockedGeneralModCosts: number[];
  /** Energy consumed by locked bucket-specific mods per slot. */
  bucketSpecificCosts: number[];
}

export interface PlannerResult extends Omit<AcquisitionPlan<PlannerPiece>, 'keep'> {
  /** Item ids of the owned pieces to keep (excluding the exotic). */
  keepIds: string[];
  /** Item id of the exotic copy the plan builds around, if any. */
  exoticId: string | undefined;
  /** The plan farms a new exotic rather than using an owned copy. */
  farmExotic: boolean;
  /** The user locked an exotic they have no available copy of. */
  exoticMissing: boolean;
  /** "Any Exotic" is selected but the user owns no available exotic. */
  anyExoticMissing: boolean;
}

export function planForTargets({
  blocks,
  desiredStatRanges,
  modStatTotals,
  piecesByBucket,
  pinnedIds,
  exoticMode,
  keepOwned,
  setBonusRequirements,
  numGeneralMods,
  autoModCosts,
  lockedGeneralModCosts,
  bucketSpecificCosts,
}: PlannerInputs): PlannerResult {
  const numBuckets = piecesByBucket.length;
  const enabledStats = desiredStatRanges
    .filter((r) => r.maxStat > 0)
    .map(({ statHash }): ArmorStatHashes => statHash);
  const statTotal = (stats: ArmorStats) =>
    enabledStats.reduce((total, statHash) => total + stats[statHash], 0);

  // A pin names a DimItem, so it admits every tuning variant of that item.
  const pinnedVariants = pinnedIds.map((id, bucketIdx) =>
    id !== undefined ? piecesByBucket[bucketIdx].filter((p) => p.itemId === id) : [],
  );
  // The single best variant of each pinned item, for picking the exotic.
  const pinnedPieces = pinnedVariants.map((variants) =>
    maxBy(variants, (piece) => statTotal(piece.stats)),
  );

  // Best owned legendary candidates per bucket (top pieces overall plus the
  // best pieces from each required set so set bonuses stay satisfiable) —
  // invariant across the exotic candidates tried below, so computed once.
  const ownedCandidatesByBucket = piecesByBucket.map((entries) => {
    if (!keepOwned) {
      return [];
    }
    const scored = entries
      .filter((piece) => !piece.isExotic)
      .map((piece) => ({ piece, total: statTotal(piece.stats) }));
    scored.sort((a, b) => b.total - a.total);
    const kept = new Set(scored.slice(0, OWNED_PER_SLOT).map((s) => s.piece));
    for (const { setHash } of setBonusRequirements) {
      for (const { piece } of scored
        .filter((s) => s.piece.setBonusHash === setHash)
        .slice(0, OWNED_PER_SLOT_PER_SET)) {
        kept.add(piece);
      }
    }
    return [...kept];
  });

  // The full-block ideal bound is identical for every farmed-exotic candidate
  // (no fixed piece, all five slots farmable), so they share one computation.
  const farmedBoundCache: { plan?: HypotheticalPlan } = {};

  // Run one acquisition plan with the given exotic (or none) locked into its
  // slot. Pinned items are locked into their slots; other slots get the owned
  // candidates computed above, or nothing when keepOwned is off (ideal drops).
  const planWithExotic = (
    exoticPiece: PlannerPiece | undefined,
    exoticBucketIdx: number | undefined,
  ): AcquisitionPlan<PlannerPiece> => {
    const remainingBuckets: number[] = [];
    for (let bucketIdx = 0; bucketIdx < numBuckets; bucketIdx++) {
      if (!(exoticPiece && bucketIdx === exoticBucketIdx)) {
        remainingBuckets.push(bucketIdx);
      }
    }
    const requiredSlots: number[] = [];
    const ownedByBucket = remainingBuckets.map((bucketIdx, slotIndex) => {
      if (pinnedIds[bucketIdx] !== undefined) {
        const variants = pinnedVariants[bucketIdx];
        if (variants.length) {
          requiredSlots.push(slotIndex);
          return variants;
        }
        return [];
      }
      if (!exoticPiece && bucketIdx === exoticBucketIdx) {
        return [];
      }
      return ownedCandidatesByBucket[bucketIdx];
    });
    const farmedEnergyBySlot = remainingBuckets.map(
      (bucketIdx) => MAX_ENERGY - bucketSpecificCosts[bucketIdx],
    );

    return planMinimumAcquisitions({
      blocks,
      desiredStatRanges,
      modStatTotals,
      fixedPieces: exoticPiece ? [exoticPiece.stats] : [],
      ownedByBucket,
      requiredSlots,
      setBonusRequirements,
      numGeneralMods,
      searchBlockLimit: MAX_SEARCH_BLOCKS,
      autoModCosts,
      lockedGeneralModCosts,
      fixedPieceEnergies: exoticPiece ? [exoticPiece.energy ?? MAX_ENERGY] : [],
      farmedEnergyBySlot,
      boundCache: exoticPiece ? undefined : farmedBoundCache,
    });
  };

  const bestExoticIn = (bucketIdx: number) =>
    maxBy(
      piecesByBucket[bucketIdx].filter((piece) => piece.isExotic),
      (piece) => statTotal(piece.stats),
    );

  let result: AcquisitionPlan<PlannerPiece>;
  let exoticId: string | undefined;
  let farmExotic = false;
  let exoticMissing = false;
  let anyExoticMissing = false;
  let combosTotal = 0;

  // Farming a new exotic is a real option: exotics roll the same archetypes as
  // legendaries, so an ideal exotic drop is stat-identical to a hypothetical
  // block. Passing no exotic piece leaves its bucket in the farmable slots.
  if (exoticMode.type === 'any') {
    // "Any Exotic": the set must include one exotic. Try each slot with the
    // user's best owned exotic there — and with a farmed one — and take the
    // best outcome. A pinned exotic decides the slot; a pinned legendary rules
    // its slot out.
    const pinnedExoticBucket = pinnedPieces.findIndex((piece) => piece?.isExotic);
    const candidates: { piece: PlannerPiece | undefined; bucketIdx: number }[] = [];
    let ownsAnyExotic = false;
    for (let bucketIdx = 0; bucketIdx < numBuckets; bucketIdx++) {
      if (pinnedExoticBucket >= 0 && bucketIdx !== pinnedExoticBucket) {
        continue;
      }
      if (pinnedIds[bucketIdx] !== undefined && !pinnedPieces[bucketIdx]?.isExotic) {
        continue;
      }
      const piece = pinnedPieces[bucketIdx] ?? bestExoticIn(bucketIdx);
      if (piece) {
        candidates.push({ piece, bucketIdx });
        ownsAnyExotic = true;
      }
      if (pinnedIds[bucketIdx] === undefined) {
        candidates.push({ piece: undefined, bucketIdx });
      }
    }
    // No owned exotic anywhere — every candidate farms one, so say so.
    anyExoticMissing = !ownsAnyExotic;
    // Owned candidates first. Each candidate is a full search, so once an owned
    // exotic reaches the target we can drop every farmed candidate untried:
    // farming costs a strictly greater farm count and can only win on a lower
    // shortfall, which no longer exists. Same answer, roughly half the work.
    candidates.sort((a, b) => (a.piece ? 0 : 1) - (b.piece ? 0 : 1));
    let best: { plan: AcquisitionPlan<PlannerPiece>; piece: PlannerPiece | undefined } | undefined;
    for (const { piece, bucketIdx } of candidates) {
      if (!piece && best?.plan.shortfall === 0) {
        continue;
      }
      const candidatePlan = planWithExotic(piece, bucketIdx);
      combosTotal += candidatePlan.combosExamined;
      if (
        !best ||
        candidatePlan.shortfall < best.plan.shortfall ||
        (candidatePlan.shortfall === best.plan.shortfall &&
          totalFarmCount(candidatePlan.farm) < totalFarmCount(best.plan.farm))
      ) {
        best = { plan: candidatePlan, piece };
      }
    }
    result = best!.plan;
    exoticId = best!.piece?.id;
    farmExotic = !best!.piece;
  } else if (exoticMode.type === 'locked') {
    // The locked exotic occupies its slot with the user's best owned copy.
    // filterItems already restricted the exotic's bucket to matching copies
    // (by hash or name), so any exotic there is the locked one.
    const exoticPiece = bestExoticIn(exoticMode.bucketIndex);
    // With no available copy, its slot gets farmed, approximated by an ideal
    // legendary block.
    exoticMissing = !exoticPiece;
    result = planWithExotic(exoticPiece, exoticMode.bucketIndex);
    combosTotal += result.combosExamined;
    exoticId = exoticPiece?.id;
    // Only prefer farming a fresh copy when it strictly beats the owned one — an
    // equal plan that costs an extra drop is not an improvement. So when the
    // owned copy already reaches the target, skip the second search entirely.
    if (exoticPiece && result.shortfall > 0) {
      const farmedPlan = planWithExotic(undefined, exoticMode.bucketIndex);
      combosTotal += farmedPlan.combosExamined;
      if (farmedPlan.shortfall < result.shortfall) {
        result = farmedPlan;
        exoticId = undefined;
        farmExotic = true;
      }
    }
  } else {
    result = planWithExotic(undefined, undefined);
    combosTotal += result.combosExamined;
  }

  const { keep, ...rest } = result;
  return {
    ...rest,
    combosExamined: combosTotal,
    keepIds: keep.map((piece) => piece.id),
    exoticId,
    farmExotic,
    exoticMissing,
    anyExoticMissing,
  };
}
