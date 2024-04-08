import { AssumeArmorMasterwork, StatConstraint } from '@destinyitemmanager/dim-api-types';
import { DimCharacterStat } from 'app/inventory/store-types';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { ProcessItem } from './process-worker/types';

export interface MinMaxTier {
  minTier: number;
  maxTier: number;
}

/**
 * Resolved stat constraints take the compact form of the API stat constraints
 * and expand them so that each stat has a corresponding constraint, the min and
 * max are defined, and the ignored flag is set. In the API version, stat
 * constraints are simply missing if ignored, and min-0/max-10 is omitted as
 * implied.
 */
export interface ResolvedStatConstraint extends Required<StatConstraint> {
  /**
   * An ignored stat has an effective maximum tier of 0, so that any
   * stat tiers in excess of T0 are deemed worthless.
   */
  ignored: boolean;
}

/**
 * When a stat is ignored, we treat it as if it were effectively a constraint
 * with a max desired tier of 0. ResolvedStatContraintRange is the same as
 * DesiredStatRange, but with the ignored flag removed, and maxTier set to
 * 0 for ignored sets.
 */
export type DesiredStatRange = Required<StatConstraint>;

/** A map from bucketHash to the pinned item if there is one. */
export interface PinnedItems {
  [bucketHash: number]: DimItem | undefined;
}

/** A map from bucketHash to any excluded items. */
export interface ExcludedItems {
  [bucketHash: number]: DimItem[] | undefined;
}

/**
 * An individual "stat mix" of loadouts where each slot has a list of items with the same stat options.
 */
export interface ArmorSet {
  /** The overall stats for the loadout as a whole, including subclass, mods and including auto stat mods. */
  readonly stats: Readonly<ArmorStats>;
  /** The assumed stats from the armor items themselves only. */
  readonly armorStats: Readonly<ArmorStats>;
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly DimItem[][];
  /** Which stat mods were added? */
  readonly statMods: number[];
}

export type ItemsByBucket = Readonly<{
  [bucketHash in LockableBucketHash]: readonly DimItem[];
}>;

/**
 * Data describing the mods that can be automatically picked.
 */
export interface AutoModDefs {
  generalMods: {
    [key in ArmorStatHashes]?: {
      majorMod: PluggableInventoryItemDefinition;
      minorMod: PluggableInventoryItemDefinition;
    };
  };
  artificeMods: { [key in ArmorStatHashes]?: PluggableInventoryItemDefinition };
}

/**
 * An item group mapping to the same process item. All items in this group
 * must be interchangeable subject to the armor energy rules, always, for any
 * given mod assignment.
 */
export type ItemGroup = Readonly<{
  canonicalProcessItem: ProcessItem;
  items: DimItem[];
}>;

/**
 * Bucket lookup, also used for ordering of the buckets.
 */
export const LockableBuckets = {
  helmet: BucketHashes.Helmet as LockableBucketHash,
  gauntlets: BucketHashes.Gauntlets as LockableBucketHash,
  chest: BucketHashes.ChestArmor as LockableBucketHash,
  leg: BucketHashes.LegArmor as LockableBucketHash,
  classitem: BucketHashes.ClassArmor as LockableBucketHash,
};

export type LockableBucketHash =
  | BucketHashes.Helmet
  | BucketHashes.Gauntlets
  | BucketHashes.ChestArmor
  | BucketHashes.LegArmor
  | BucketHashes.ClassArmor;

export const LockableBucketHashes = Object.values(LockableBuckets);

export type ModStatChanges = {
  [statHash in ArmorStatHashes]: Pick<DimCharacterStat, 'value' | 'breakdown'>;
};

export type ArmorStatHashes =
  | StatHashes.Mobility
  | StatHashes.Resilience
  | StatHashes.Recovery
  | StatHashes.Discipline
  | StatHashes.Intellect
  | StatHashes.Strength;

export type StatRanges = { [statHash in ArmorStatHashes]: MinMaxTier };
export type ArmorStats = { [statHash in ArmorStatHashes]: number };

/**
 * The reusablePlugSetHash from armour 2.0's general socket.
 * TODO: Find a way to generate this in d2ai.
 */
export const generalSocketReusablePlugSetHash = 731468111;

/**
 * The reusablePlugSetHash for artifice armor's artifice socket, with +3 mods.
 * TODO: Find a way to generate this in d2ai.
 */
export const artificeSocketReusablePlugSetHash = 4285066582;

/** Bonus to a single stat given by plugs in artifice armor's exclusive mod slot */
export const artificeStatBoost = 3;
/** Bonus to a single stat given by the "half tier mods" plugs in all armor's general mod slot */
export const minorStatBoost = 5;
/**
 * Bonus to a single stat given by the "full tier mods" plugs in all armor's general mod slot.
 * The fact that a major mod gives exactly 1 tier without changing the number of remainder points
 * is fairly engrained in some of the algorithms, so it wouldn't be quite trivial to change this.
 */
export const majorStatBoost = 10;

/**
 * Special value for lockedExoticHash indicating the user would not like any exotics included in their loadouts.
 */
export const LOCKED_EXOTIC_NO_EXOTIC = -1;
/**
 * Special value for lockedExoticHash indicating the user would like an exotic, but doesn't care which one.
 */
export const LOCKED_EXOTIC_ANY_EXOTIC = -2;
/**
 * The minimum armour energy value used in the LO Builder
 */
export const MIN_LO_ITEM_ENERGY = 9;
/**
 * The armor energy rules that Loadout Optimizer uses by default.
 * Requires a reasonable and inexpensive amount of upgrade materials.
 */
export const loDefaultArmorEnergyRules: ArmorEnergyRules = {
  assumeArmorMasterwork: AssumeArmorMasterwork.None,
  minItemEnergy: MIN_LO_ITEM_ENERGY,
};
/**
 * The armor energy rules that describe the changes DIM can
 * make in-game -- none as of now.
 */
export const inGameArmorEnergyRules: ArmorEnergyRules = {
  assumeArmorMasterwork: AssumeArmorMasterwork.None,
  minItemEnergy: 1,
};

/**
 * Armor energy rules that allow fully masterworking everything.
 */
export const permissiveArmorEnergyRules: ArmorEnergyRules = {
  assumeArmorMasterwork: AssumeArmorMasterwork.All,
  // implied to be 10 by the above
  minItemEnergy: 1,
};

/**
 * Rules describing how armor can change energy capacity
 * to accommodate mods and hit optimal stats.
 */
export interface ArmorEnergyRules {
  assumeArmorMasterwork: AssumeArmorMasterwork;
  /**
   * How much energy capacity items have at least.
   */
  minItemEnergy: number;
}
