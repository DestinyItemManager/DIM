import { InventoryBucket } from 'app/inventory/inventory-buckets';
import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
  armorBuckets,
  D2ArmorStatHashByName,
} from 'app/search/d2-known-values';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';

// todo: get this from d2-known-values
export type StatTypes =
  | 'Mobility'
  | 'Resilience'
  | 'Recovery'
  | 'Discipline'
  | 'Intellect'
  | 'Strength';

export interface MinMax {
  min: number;
  max: number;
}

export interface MinMaxIgnored {
  min: number;
  max: number;
  ignored: boolean;
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

export interface LockedExclude {
  type: 'exclude';
  item: DimItem;
  bucket: InventoryBucket;
}

export type LockedItemType = LockedItemCase | LockedPerk | LockedExclude;

/** A map from bucketHash to the list of locked and excluded perks, items, and burns. */
export type LockedMap = Readonly<{
  [bucketHash: number]: readonly LockedItemType[] | undefined;
}>;

export interface LockedMod {
  /** Essentially an identifier for each mod, as a single mod definition can be selected multiple times.*/
  key: number;
  modDef: PluggableInventoryItemDefinition;
}

/** An object of plugCategoryHashes to arrays of locked mods with said plugCategoryHash. */
export type LockedMods = {
  [plugCategoryHash: number]: LockedMod[] | undefined;
};

/**
 * An individual "stat mix" of loadouts where each slot has a list of items with the same stat options.
 */
export interface ArmorSet {
  /** The overall stats for the loadout as a whole. */
  readonly stats: Readonly<{ [statType in StatTypes]: number }>;
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly DimItem[][];
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

export const LockableBucketHashes = Object.values(LockableBuckets);

export const bucketsToCategories = {
  [LockableBuckets.helmet]: armor2PlugCategoryHashesByName.helmet,
  [LockableBuckets.gauntlets]: armor2PlugCategoryHashesByName.gauntlets,
  [LockableBuckets.chest]: armor2PlugCategoryHashesByName.chest,
  [LockableBuckets.leg]: armor2PlugCategoryHashesByName.leg,
  [LockableBuckets.classitem]: armor2PlugCategoryHashesByName.classitem,
};

export const slotSpecificPlugCategoryHashes = [
  armor2PlugCategoryHashesByName.helmet,
  armor2PlugCategoryHashesByName.gauntlets,
  armor2PlugCategoryHashesByName.chest,
  armor2PlugCategoryHashesByName.leg,
  armor2PlugCategoryHashesByName.classitem,
];

// TODO generate this somehow so we dont need to maintain it
export const raidPlugCategoryHashes = [
  PlugCategoryHashes.EnhancementsSeasonOutlaw, // last wish
  PlugCategoryHashes.EnhancementsRaidGarden, // garden of salvation
  PlugCategoryHashes.EnhancementsRaidDescent, // deep stone crypt
];

export const knownModPlugCategoryHashes = [...armor2PlugCategoryHashes, ...raidPlugCategoryHashes];

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

/**
 * The resuablePlugSetHash from armour 2.0's general socket.
 * TODO: Find a way to generate this in d2ai.
 */
export const generalSocketReusablePlugSetHash = 3559124992;

export type PluggableItemsByPlugCategoryHash = {
  [plugCategoryHash: number]: PluggableInventoryItemDefinition[] | undefined;
};
