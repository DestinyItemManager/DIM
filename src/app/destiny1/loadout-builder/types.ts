import { D1Item, D1GridNode } from '../../inventory/item-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { DimCharacterStat } from 'app/inventory/store-types';

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
  | 'Helmet'
  | 'Gauntlets'
  | 'Chest'
  | 'Leg'
  | 'ClassItem'
  | 'Artifact'
  | 'Ghost';

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
