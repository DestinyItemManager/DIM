import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import {
  armor2PlugCategoryHashesByName,
  armorBuckets,
  D2ArmorStatHashByName,
} from 'app/search/d2-known-values';

// todo: get this from d2-known-values
export type StatTypes =
  | 'Mobility'
  | 'Resilience'
  | 'Recovery'
  | 'Discipline'
  | 'Intellect'
  | 'Strength';

// todo: and this?
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
  perk: PluggableInventoryItemDefinition;
  bucket: InventoryBucket;
}
export interface LockedModBase {
  mod: PluggableInventoryItemDefinition;
  plugSetHash: number;
}
export interface LockedMod extends LockedModBase {
  type: 'mod';
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

export const ModPickerCategories = {
  ...armor2PlugCategoryHashesByName,
  seasonal: 'seasonal',
} as const;
export type ModPickerCategory = typeof ModPickerCategories[keyof typeof ModPickerCategories];

/**
 * Checks whether the passed in value is a ModPickerCategory.
 */
export function isModPickerCategory(value: unknown): value is ModPickerCategory {
  return (
    value === ModPickerCategories.general ||
    value === ModPickerCategories.helmet ||
    value === ModPickerCategories.gauntlets ||
    value === ModPickerCategories.chest ||
    value === ModPickerCategories.leg ||
    value === ModPickerCategories.classitem ||
    value === ModPickerCategories.seasonal
  );
}

export interface LockedArmor2Mod {
  /** Essentially an identifier for each mod, as a single mod definition can be selected multiple times.*/
  key?: number;
  mod: PluggableInventoryItemDefinition;
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
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly DimItem[][];
  /** The chosen stats for each armor type, as a list in the order Mobility/Resiliency/Recovery. */
  readonly statChoices: readonly number[][];
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
  helmet: armorBuckets.helmet,
  gauntlets: armorBuckets.gauntlets,
  chest: armorBuckets.chest,
  leg: armorBuckets.leg,
  classitem: armorBuckets.classitem,
};

export const bucketsToCategories = {
  [LockableBuckets.helmet]: armor2PlugCategoryHashesByName.helmet,
  [LockableBuckets.gauntlets]: armor2PlugCategoryHashesByName.gauntlets,
  [LockableBuckets.chest]: armor2PlugCategoryHashesByName.chest,
  [LockableBuckets.leg]: armor2PlugCategoryHashesByName.leg,
  [LockableBuckets.classitem]: armor2PlugCategoryHashesByName.classitem,
};

// to-do: deduplicate this and use D2ArmorStatHashByName instead
export const statHashes: { [type in StatTypes]: number } = {
  Mobility: D2ArmorStatHashByName.mobility,
  Resilience: D2ArmorStatHashByName.resilience,
  Recovery: D2ArmorStatHashByName.recovery,
  Discipline: D2ArmorStatHashByName.discipline,
  Intellect: D2ArmorStatHashByName.intellect,
  Strength: D2ArmorStatHashByName.strength,
};

export const statValues = Object.values(statHashes);
export const statKeys = Object.keys(statHashes) as StatTypes[];

// Need to force the type as lodash converts the StatTypes type to string.
export const statHashToType = _.invert(statHashes) as { [hash: number]: StatTypes };
