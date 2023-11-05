import { ArmorStatHashes, ArmorStats, LockableBucketHash, StatRanges } from '../types';

export interface ProcessResult {
  /** A small number of the best sets, depending on operation mode. */
  sets: ProcessArmorSet[];
  /** The total number of combinations considered. */
  combos: number;
  /** The stat ranges of all sets that matched our filters & mod selection. */
  statRangesFiltered?: StatRanges;
  /** Statistics about how many sets passed/failed the constraints, for error reporting */
  processInfo?: ProcessStatistics;
}

export interface ProcessItem {
  id: string;
  hash: number;
  name: string;
  isExotic: boolean;
  isArtifice: boolean;
  /** The remaining assumed energy capacity for this item, after assigning slot-specific mods */
  remainingEnergyCapacity: number;
  power: number;
  stats: { [statHash: number]: number };
  compatibleModSeasons?: string[];
}

export type ProcessItemsByBucket = {
  [bucketHash in LockableBucketHash]: ProcessItem[];
};

export interface ProcessArmorSet {
  /** The overall stats for the loadout as a whole, including subclass, mods and including auto stat mods. */
  readonly stats: Readonly<ArmorStats>;
  /** The assumed stats from the armor items themselves only. */
  readonly armorStats: Readonly<ArmorStats>;
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly string[];
  /** Which stat mods were added? */
  readonly statMods: number[];
}

export interface IntermediateProcessArmorSet {
  /** The overall stats for the loadout as a whole, EXCLUDING auto stat mods. */
  stats: number[];
  /** The first (highest-power) valid set from this stat mix. */
  armor: ProcessItem[];
}

export interface ProcessMod {
  hash: number;
  /** The energy cost of the mod. */
  energyCost: number;
  /** This should only be available in legacy, combat and raid mods */
  tag?: string;
}

/**
 * Data describing the mods that can be automatically picked.
 */
export interface AutoModData {
  generalMods: {
    [key in ArmorStatHashes]?: {
      majorMod: { hash: number; cost: number };
      minorMod: { hash: number; cost: number };
    };
  };
  artificeMods: { [key in ArmorStatHashes]?: { hash: number } };
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
