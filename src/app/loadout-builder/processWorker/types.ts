import { StatTypes } from '../types';

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
  hasEnergy: boolean;
  basePower: number;
  stats: { [statHash: number]: number };
}

export type ProcessItemsByBucket = Readonly<{
  [bucketHash: number]: readonly ProcessItem[];
}>;

export interface ProcessArmorSet {
  /** The overall stats for the loadout as a whole. */
  readonly stats: Readonly<{ [statType in StatTypes]: number }>;

  /**
   * Potential stat mixes that can achieve the overall stats.
   * Each mix is a particular set of stat choices (and options for each piece within that)
   * to get to the overall stats.
   */
  readonly sets: {
    /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
    readonly armor: readonly string[][];
    /** The chosen stats for each armor type, as a list in the order Mobility/Resiliency/Recovery. */
    readonly statChoices: readonly number[][];
    readonly maxPower: readonly number;
  }[];

  /** The first (highest-power) valid set from this stat mix. */
  readonly firstValidSet: readonly string[];
  readonly firstValidSetStatChoices: readonly number[][];

  /** The maximum power loadout possible in this stat mix. */
  readonly maxPower: number;
}
