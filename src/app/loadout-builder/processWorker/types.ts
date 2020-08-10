import { StatTypes, ModPickerCategory } from '../types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';

export interface ProcessPlug {
  stats: {
    [statHash: number]: number;
  } | null;
  plugItemHash: number;
}

export interface ProcessSocket {
  plug: ProcessPlug | null;
  plugOptions: ProcessPlug[];
}

export interface ProcessSocketCategory {
  categoryStyle: number;
  sockets: ProcessSocket[];
}

export interface ProcessSockets {
  sockets: ProcessSocket[];
  /** Sockets grouped by category. */
  categories: ProcessSocketCategory[];
}
export interface ProcessItem {
  bucketHash: number;
  id: string;
  type: string;
  name: string;
  equippingLabel?: string;
  sockets: ProcessSockets | null;
  energy: {
    type: DestinyEnergyType;
    /** This is used to track the energy used by mods in a build. Using the name cost so that we can use the same sorting
     * function for ProcessItems and ProcessMods. */
    val: number;
    /** This contains the energy usage by slot specific mods in the mod picker. Those mods are preprocessed so we don't
     * need to recalculate them over and over. */
    valInitial: number;
  } | null;
  basePower: number;
  stats: { [statHash: number]: number };
  baseStats: { [statHash: number]: number };
  season?: number;
  compatibleModSeasons?: string[];
}

export type ProcessItemsByBucket = Readonly<{
  [bucketHash: number]: ProcessItem[];
}>;

export interface ProcessArmorSet {
  /** The overall stats for the loadout as a whole. */
  readonly stats: Readonly<{ [statType in StatTypes]: number }>;
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly string[];
  /** The chosen stats for each armor type, as a list in the order Mobility/Resiliency/Recovery. */
  readonly statChoices: readonly number[][];
  /** The maximum power loadout possible in this stat mix. */
  readonly maxPower: number;
}

export interface IntermediateProcessArmorSet {
  /** The overall stats for the loadout as a whole. */
  stats: { [statType in StatTypes]: number };
  /** The first (highest-power) valid set from this stat mix. */
  armor: ProcessItem[];
  /** The chosen stats for each armor type, as a list in the order Mobility/Resiliency/Recovery. */
  statChoices: number[][];
  /** The maximum power loadout possible in this stat mix. */
  maxPower: number;
}

interface ProcessStat {
  statTypeHash: number;
  value: number;
}

export interface ProcessMod {
  hash: number;
  energy: {
    type: DestinyEnergyType;
    /** The energy cost of the mod. */
    val: number;
  };
  investmentStats: ProcessStat[];
  /** This should only be available in seasonal mods */
  season?: number;
  /** This should only be available in seasonal mods */
  tag?: string;
}

export type LockedArmor2ProcessMods = {
  [T in ModPickerCategory]: ProcessMod[];
};
