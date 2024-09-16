import { DimCharacterStat } from 'app/inventory/store-types';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { D1GridNode, D1Item } from '../../inventory/item-types';

export interface D1ItemWithNormalStats extends D1Item {
  normalStats?: {
    [hash: number]: {
      statHash: number;
      base: number;
      scaled: number;
      bonus: number;
      split: number;
      qualityPercentage: number;
    };
  };
  vendorIcon?: string;
}

export type ArmorTypes =
  | BucketHashes.Helmet
  | BucketHashes.Gauntlets
  | BucketHashes.ChestArmor
  | BucketHashes.LegArmor
  | BucketHashes.ClassArmor
  | D1BucketHashes.Artifact
  | BucketHashes.Ghost;

export type ClassTypes = DestinyClass.Titan | DestinyClass.Warlock | DestinyClass.Hunter;

export interface ArmorSet {
  armor: {
    [armorType in ArmorTypes]: {
      item: D1ItemWithNormalStats;
      bonusType: string;
    };
  };
  stats: {
    [statHash: number]: DimCharacterStat;
  };
  setHash: string;
  includesVendorItems: boolean;
}

export interface LockedPerk {
  icon: string;
  description: string;
  lockType: 'and' | 'or';
}

export type ItemBucket = { [armorType in ArmorTypes]: D1ItemWithNormalStats[] };
export type PerkCombination = { [armorType in ArmorTypes]: D1GridNode[] };

export interface LockedPerkHash {
  [hash: number]: LockedPerk;
}

export interface SetType {
  set: ArmorSet;
  tiers: {
    [tierString: string]: {
      stats: ArmorSet['stats'];
      configs: { [armorType in ArmorTypes]: string }[];
    };
  };
}
