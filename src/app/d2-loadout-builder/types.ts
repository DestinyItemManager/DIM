import { D2Item } from '../inventory/item-types';

export type StatTypes = 'STAT_MOBILITY' | 'STAT_RESILIENCE' | 'STAT_RECOVERY';

export interface LockType {
  type: 'item' | 'perk' | 'exclude';
  items: D2Item[];
}

export interface ArmorSet {
  armor: D2Item[];
  power: number;
  tiers: string[];
  includesVendorItems: boolean;
}

// bucket lookup, also used for ordering of the buckets.
export const LockableBuckets = {
  helmet: 3448274439,
  gauntlets: 3551918588,
  chest: 14239492,
  leg: 20886954,
  classitem: 1585787867
};
