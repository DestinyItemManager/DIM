import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { StatTypes } from '../types';

export interface ProcessPlug {
  stats: {
    [statHash: number]: number;
  } | null;
  plugItemHash: number;
}

export interface ProcessItem {
  bucketHash: number;
  id: string;
  type: string;
  name: string;
  equippingLabel?: string;
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
  basePower: number;
  baseStats: { [statHash: number]: number };
  compatibleModSeasons?: string[];
  hasLegacyModSocket: boolean;
}

export type ProcessItemsByBucket = Readonly<{
  [bucketHash: number]: ProcessItem[];
}>;

export interface ProcessArmorSet {
  /** The overall stats for the loadout as a whole. */
  readonly stats: Readonly<{ [statType in StatTypes]: number }>;
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly string[];
}

export interface IntermediateProcessArmorSet {
  /** The overall stats for the loadout as a whole. */
  stats: { [statType in StatTypes]: number };
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
