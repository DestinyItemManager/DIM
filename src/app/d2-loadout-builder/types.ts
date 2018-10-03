import { D2Item } from '../inventory/item-types';

type ArmorTypes = 'Helmet' | 'Gauntlets' | 'Chest' | 'Leg' | 'ClassItem';
type StatTypes = 'STAT_MOBILITY' | 'STAT_RESILIENCE' | 'STAT_RECOVERY';

export interface LockType {
  type: 'item' | 'perk' | 'exclude';
  items: D2Item[];
}

export interface ArmorSet {
  armor: D2Item[];
  power: number;
  stats: { [statType in StatTypes]: number };
  setHash: string;
  includesVendorItems: boolean;
}

export interface SetType {
  set: ArmorSet;
  tiers: {
    [tierString: string]: {
      stats: ArmorSet['stats'];
      configs: { [armorType in ArmorTypes]: string };
    };
  };
}

// bucket lookup, also used for ordering of the buckets.
export const LockableBuckets = {
  helmet: 3448274439,
  gauntlets: 3551918588,
  chest: 14239492,
  leg: 20886954,
  classitem: 1585787867
};
