import { armor2PlugCategoryHashesByName, armorBuckets } from 'app/search/d2-known-values';
import { StatHashes } from 'data/d2/generated-enums';
import { DimItem } from '../inventory/item-types';

export interface MinMax {
  min: number;
  max: number;
}

export interface MinMaxIgnored {
  min: number;
  max: number;
  ignored: boolean;
}

/** A map from bucketHash to the pinned item if there is one. */
export type PinnedItems = {
  [bucketHash: number]: DimItem | undefined;
};

/** A map from bucketHash to any excluded items. */
export type ExcludedItems = {
  [bucketHash: number]: DimItem[] | undefined;
};

/**
 * An individual "stat mix" of loadouts where each slot has a list of items with the same stat options.
 */
export interface ArmorSet {
  /** The overall stats for the loadout as a whole. */
  readonly stats: Readonly<ArmorStats>;
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

export type ArmorStatHashes =
  | StatHashes.Mobility
  | StatHashes.Resilience
  | StatHashes.Recovery
  | StatHashes.Discipline
  | StatHashes.Intellect
  | StatHashes.Strength;

export type StatRanges = { [statHash in ArmorStatHashes]: MinMax };
export type StatFilters = { [statHash in ArmorStatHashes]: MinMaxIgnored };
export type ArmorStats = { [statHash in ArmorStatHashes]: number };

/**
 * The resuablePlugSetHash from armour 2.0's general socket.
 * TODO: Find a way to generate this in d2ai.
 */
export const generalSocketReusablePlugSetHash = 3559124992;
