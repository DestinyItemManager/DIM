import { ArmorStats, LockableBucketHash } from '../types';

export interface ProcessItem {
  id: string;
  hash: number;
  name: string;
  isExotic: boolean;
  isArtifice: boolean;
  energy?: {
    /** The maximum energy capacity for the item, e.g. if masterworked this will be 10. */
    capacity: number;
    /**
     * This is used to track the energy used by mods in a build. Using the name 'val' so that we can use the same sorting
     * function for ProcessItems and ProcessMods.
     */
    val: number;
  };
  power: number;
  stats: { [statHash: number]: number };
  compatibleModSeasons?: string[];
}

export type ProcessItemsByBucket = {
  [bucketHash in LockableBucketHash]: ProcessItem[];
};

export interface ProcessArmorSet {
  /** The overall stats for the loadout as a whole, but excluding auto stat mods. */
  readonly stats: Readonly<ArmorStats>;
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly string[];
  /** Which stat mods were added? */
  readonly statMods: number[];
}

export interface IntermediateProcessArmorSet {
  /** The overall stats for the loadout as a whole, but excluding auto stat mods. */
  stats: number[];
  /** The first (highest-power) valid set from this stat mix. */
  armor: ProcessItem[];
  /** Which stat mods were added? */
  statMods: number[];
}

interface ProcessStat {
  statTypeHash: number;
  value: number;
}

export interface ProcessMod {
  hash: number;
  plugCategoryHash: number;
  energy?: {
    /** The energy cost of the mod. */
    val: number;
  };
  investmentStats: ProcessStat[];
  /** This should only be available in legacy, combat and raid mods */
  tag?: string;
}

export interface LockedProcessMods {
  generalMods: ProcessMod[];
  activityMods: ProcessMod[];
}

export interface RejectionRate {
  timesFailed: number;
  timesChecked: number;
}

export interface ModAssignmentStatistics {
  /** Mod-tag and mod element counts check. */
  earlyModsCheck: RejectionRate;
  /** How many times we couldn't possibly hit the target stats with any number of auto mods picks */
  autoModsPick: RejectionRate;
  finalAssignment: {
    /** How many times we tried mod permutations for permutations that worked. */
    modAssignmentAttempted: number;
    /** How many times we failed to assign user-picked slot-independent mods. */
    modsAssignmentFailed: number;
    /** How many times we failed to assign auto stat mods. */
    autoModsAssignmentFailed: number;
  };
}

/**
 * Information about the operation of the worker process.
 */
export interface ProcessStatistics {
  numProcessed: number;
  numValidSets: number;
  statistics: {
    /** Sets skipped for really uninteresting/coarse reasons. */
    skipReasons: {
      noExotic: number;
      doubleExotic: number;
      skippedLowTier: number;
    };
    lowerBoundsExceeded: RejectionRate;
    upperBoundsExceeded: RejectionRate;
    modsStatistics: ModAssignmentStatistics;
  };
}
