import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { ArmorStats, LockableBucketHash } from '../types';

export interface ProcessItem {
  id: string;
  hash: number;
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
    type: DestinyEnergyType;
    /** The energy cost of the mod. */
    val: number;
  };
  investmentStats: ProcessStat[];
  /** This should only be available in legacy, combat and raid mods */
  tag?: string;
}

export interface LockedProcessMods {
  generalMods: ProcessMod[];
  combatMods: ProcessMod[];
  activityMods: ProcessMod[];
}
