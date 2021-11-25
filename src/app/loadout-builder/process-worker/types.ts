import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { ArmorStats, LockableBucketHash } from '../types';

export interface ProcessItem {
  bucketHash: number;
  id: string;
  hash: number;
  type: string;
  name: string;
  isExotic: boolean;
  energy?: {
    type: DestinyEnergyType;
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
  /** The overall stats for the loadout as a whole. */
  readonly stats: Readonly<ArmorStats>;
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly string[];
}

export interface IntermediateProcessArmorSet {
  /** The overall stats for the loadout as a whole. */
  stats: ArmorStats;
  /** The first (highest-power) valid set from this stat mix. */
  armor: ProcessItem[];
}

interface ProcessStat {
  statTypeHash: number;
  value: number;
}

export interface ProcessMod {
  hash: number;
  plugCategoryHash: number;
  energy?: {
    type: DestinyEnergyType;
    /** The energy cost of the mod. */
    val: number;
  };
  investmentStats: ProcessStat[];
  /** This should only be available in legacy, combat and raid mods */
  tag?: string;
}

export type LockedProcessMods = {
  [plugCategoryHash: number]: ProcessMod[];
};
