import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { DimSockets, DimStat } from '../../inventory/item-types';
import { DestinyItemInstanceEnergy } from 'bungie-api-ts/destiny2';
import { StatTypes } from '../types';

export interface ProcessItem {
  owner: string;
  destinyVersion: DestinyVersion;
  bucketHash: number;
  id: string;
  type: string;
  name: string;
  equipped: boolean;
  equippingLabel?: string;
  sockets: DimSockets | null;
  energy: DestinyItemInstanceEnergy | null;
  basePower: number;
  stats: DimStat[] | null;
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
  }[];

  /** The first (highest-power) valid set from this stat mix. */
  readonly firstValidSet: readonly string[];
  readonly firstValidSetStatChoices: readonly number[][];

  /** The maximum power loadout possible in this stat mix. */
  readonly maxPower: number;
}
