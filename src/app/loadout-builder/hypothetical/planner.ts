import { sumBy } from 'app/utils/collections';
import { ArmorStatHashes, ArmorStats, DesiredStatRange } from '../types';
import {
  AcquisitionPlan,
  HypotheticalArmorBlock,
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

/** How many owned candidates to consider per slot (plus set-bonus pieces). */
const OWNED_PER_SLOT = 10;
/** How many extra set-bonus candidates to consider per slot per required set. */
const OWNED_PER_SLOT_PER_SET = 4;
/** How many hypothetical stat blocks the owned search considers. */
const MAX_BLOCKS = 24;
/** Energy capacity of a masterworked piece. */
const MAX_ENERGY = 10;

/** A candidate owned piece, referencing its DimItem only by id. */
export interface PlannerPiece extends PlannerOwnedPiece {
  id: string;
  isExotic: boolean;
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

  const pinnedPieces = pinnedIds.map((id, bucketIdx) =>
    id !== undefined ? piecesByBucket[bucketIdx].find((p) => p.id === id) : undefined,
  );

  // Run one acquisition plan with the given exotic (or none) locked into its
  // slot. Owned candidates per remaining slot: pinned items are locked in;
  // else the best pieces overall plus the best pieces from each required set
  // so set bonuses stay satisfiable. With keepOwned off, unpinned slots are
  // planned as ideal drops.
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
      const entries = piecesByBucket[bucketIdx];
      if (pinnedIds[bucketIdx] !== undefined) {
        const pinnedPiece = pinnedPieces[bucketIdx];
        if (pinnedPiece) {
          requiredSlots.push(slotIndex);
          return [pinnedPiece];
        }
        return [];
      }
      if (!keepOwned || (!exoticPiece && bucketIdx === exoticBucketIdx)) {
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
      searchBlockLimit: MAX_BLOCKS,
      autoModCosts,
      lockedGeneralModCosts,
      fixedPieceEnergies: exoticPiece ? [exoticPiece.energy ?? MAX_ENERGY] : [],
      farmedEnergyBySlot,
    });
  };

  const farmCount = (p: AcquisitionPlan<PlannerPiece>) => sumBy(p.farm, ({ count }) => count);
  const bestExoticIn = (bucketIdx: number) => {
    let best: PlannerPiece | undefined;
    for (const piece of piecesByBucket[bucketIdx]) {
      if (piece.isExotic && (!best || statTotal(piece.stats) > statTotal(best.stats))) {
        best = piece;
      }
    }
    return best;
  };

  let result: AcquisitionPlan<PlannerPiece>;
  let exoticId: string | undefined;
  let exoticMissing = false;
  let anyExoticMissing = false;
  let combosTotal = 0;

  if (exoticMode.type === 'any') {
    // "Any Exotic": the set must include one exotic. Try each slot with the
    // user's best owned exotic there and take the best outcome. A pinned
    // exotic decides the slot; a pinned legendary rules its slot out.
    const pinnedExoticBucket = pinnedPieces.findIndex((piece) => piece?.isExotic);
    const candidates: { piece: PlannerPiece; bucketIdx: number }[] = [];
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
      }
    }
    let best: { plan: AcquisitionPlan<PlannerPiece>; piece: PlannerPiece } | undefined;
    for (const { piece, bucketIdx } of candidates) {
      const candidatePlan = planWithExotic(piece, bucketIdx);
      combosTotal += candidatePlan.combosExamined;
      if (
        !best ||
        candidatePlan.shortfall < best.plan.shortfall ||
        (candidatePlan.shortfall === best.plan.shortfall &&
          farmCount(candidatePlan) < farmCount(best.plan))
      ) {
        best = { plan: candidatePlan, piece };
      }
    }
    if (best) {
      result = best.plan;
      exoticId = best.piece.id;
    } else {
      // No owned exotic anywhere — plan ideal drops and say one must be exotic.
      result = planWithExotic(undefined, undefined);
      combosTotal += result.combosExamined;
      anyExoticMissing = true;
    }
  } else if (exoticMode.type === 'locked') {
    // The locked exotic occupies its slot with the user's best owned copy.
    // filterItems already restricted the exotic's bucket to matching copies
    // (by hash or name), so any exotic there is the locked one.
    const exoticPiece = bestExoticIn(exoticMode.bucketIndex);
    // The user locked an exotic they have no available copy of — its slot
    // must be farmed (approximated by an ideal legendary block) and we say so.
    exoticMissing = !exoticPiece;
    result = planWithExotic(exoticPiece, exoticMode.bucketIndex);
    combosTotal += result.combosExamined;
    exoticId = exoticPiece?.id;
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
    exoticMissing,
    anyExoticMissing,
  };
}
