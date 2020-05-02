import { Armor2ModPlugCategories } from 'app/utils/item-utils';
import { DimItem } from '../inventory/item-types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBucket } from 'app/inventory/inventory-buckets';

export type StatTypes =
  | 'Mobility'
  | 'Resilience'
  | 'Recovery'
  | 'Discipline'
  | 'Intellect'
  | 'Strength';

export type BurnTypes = 'arc' | 'solar' | 'void';

export interface MinMax {
  min: number;
  max: number;
}

export interface MinMaxIgnored {
  min: number;
  max: number;
  ignored: boolean;
}

export interface BurnItem {
  dmg: BurnTypes;
  displayProperties: {
    name: string;
    icon: string;
  };
}

export interface LockedItemCase {
  type: 'item';
  item: DimItem;
  bucket: InventoryBucket;
}
export interface LockedPerk {
  type: 'perk';
  perk: DestinyInventoryItemDefinition;
  bucket: InventoryBucket;
}
export interface LockedMod {
  type: 'mod';
  mod: DestinyInventoryItemDefinition;
  plugSetHash: number;
  bucket: InventoryBucket;
}
export interface LockedBurn {
  type: 'burn';
  burn: BurnItem;
  bucket: InventoryBucket;
}
export interface LockedExclude {
  type: 'exclude';
  item: DimItem;
  bucket: InventoryBucket;
}

export type LockedItemType = LockedItemCase | LockedPerk | LockedMod | LockedBurn | LockedExclude;

/** A map from bucketHash or seasonal to the list of locked and excluded perks, items, and burns. */
export type LockedMap = Readonly<{
  [bucketHash: number]: readonly LockedItemType[] | undefined;
}>;

export const ModPickerCategories = { ...Armor2ModPlugCategories, seasonal: 'seasonal' } as const;
export type ModPickerCategory = typeof ModPickerCategories[keyof typeof ModPickerCategories];

export interface LockedArmor2Mod {
  mod: DestinyInventoryItemDefinition;
  category: ModPickerCategory;
}

export type LockedArmor2ModMap = {
  [T in ModPickerCategory]: LockedArmor2Mod[];
};

/**
 * An individual "stat mix" of loadouts where each slot has a list of items with the same stat options.
 */
export interface ArmorSet {
  /** The overall stats for the loadout as a whole. */
  readonly stats: Readonly<{ [statType in StatTypes]: number }>;

  /**
   * Potential stat mixes that can achieve the overall stats.
   * Each mix is a particular set of stat choices (and options for each piece within that)
   * to get to the overall stats.
   */
  readonly sets: {
    /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
    readonly armor: readonly DimItem[][];
    /** The chosen stats for each armor type, as a list in the order Mobility/Resiliency/Recovery. */
    readonly statChoices: readonly number[][];
  }[];

  /** The first (highest-power) valid set from this stat mix. */
  readonly firstValidSet: readonly DimItem[];
  readonly firstValidSetStatChoices: readonly number[][];

  /** The maximum power loadout possible in this stat mix. */
  readonly maxPower: number;
}

export type ItemsByBucket = Readonly<{
  [bucketHash: number]: readonly DimItem[];
}>;

/**
 * Bucket lookup, also used for ordering of the buckets.
 */
export const LockableBuckets = {
  helmet: 3448274439,
  gauntlets: 3551918588,
  chest: 14239492,
  leg: 20886954,
  classitem: 1585787867,
  ghost: 4023194814
};
