import { D2Item } from '../inventory/item-types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';

export type StatTypes = 'STAT_MOBILITY' | 'STAT_RESILIENCE' | 'STAT_RECOVERY';

export interface LockedItemType {
  type: 'item' | 'perk' | 'exclude';
  item: D2Item | DestinyInventoryItemDefinition;
}

export interface ArmorSet {
  id: number;
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
