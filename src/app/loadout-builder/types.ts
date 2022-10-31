import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import { LoadoutsByItem } from 'app/loadout-drawer/selectors';
import { armorBuckets } from 'app/search/d2-known-values';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import { DimItem } from '../inventory/item-types';
import { ProcessItem } from './process-worker/types';

export interface MinMax {
  min: number;
  max: number;
}

export type Priority = 'prioritized' | 'considered' | 'ignored';

export interface MinMaxPriority {
  min: number;
  max: number;
  priority: Priority;
}

/**
 * When to automatically add stat mods to generated sets.
 */
export const enum AutoStatModsSetting {
  /** Don't add any automatically */
  None,
  /** Add stat mods to meet minimum required tiers */
  Minimums,
  /** Optimize stat tiers according to priority */
  Maximize,
}

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
  /** For each armor type (see LockableBuckets), this is the list of items that could interchangeably be put into this loadout. */
  readonly armor: readonly DimItem[][];
  /** Which stat mods were added? */
  readonly statMods: number[];
  /** The tier of this builds' enabled stats, excluding auto stat mods. */
  readonly enabledBaseTier: number;
  /** The tier of this builds' enabled stats including auto stat mods. */
  readonly enabledTier: number;
  /** The tier of this builds' total stats, even ignored ones. */
  readonly totalTier: number;
  /** The number of tiers in the "prioritized" section. */
  readonly prioritizedTier: number;
  /** The number of .5 tiers in the "prioritized" section. */
  readonly prioritizedPlusFives: number;
  /** The number of .5 tiers in the "considered" section. */
  readonly consideredPlusFives: number;
  /** The overall stats for the loadout as a whole, but excluding auto stat mods. */
  readonly stats: Readonly<ArmorStats>;
  /** The overall stats for the loadout as a whole, including auto stat mods. */
  readonly totalStats: Readonly<ArmorStats>;
}

export type ItemsByBucket = Readonly<{
  [bucketHash in LockableBucketHash]: readonly DimItem[];
}>;

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
export const LockableBuckets = armorBuckets as {
  helmet: LockableBucketHash;
  gauntlets: LockableBucketHash;
  chest: LockableBucketHash;
  leg: LockableBucketHash;
  classitem: LockableBucketHash;
};

export type LockableBucketHash =
  | BucketHashes.Helmet
  | BucketHashes.Gauntlets
  | BucketHashes.ChestArmor
  | BucketHashes.LegArmor
  | BucketHashes.ClassArmor;

export const LockableBucketHashes = Object.values(LockableBuckets);

export type ArmorStatHashes =
  | StatHashes.Mobility
  | StatHashes.Resilience
  | StatHashes.Recovery
  | StatHashes.Discipline
  | StatHashes.Intellect
  | StatHashes.Strength;

export type StatRanges = { [statHash in ArmorStatHashes]: MinMax };
export type StatFilters = { [statHash in ArmorStatHashes]: MinMaxPriority };
export type ArmorStats = { [statHash in ArmorStatHashes]: number };

/**
 * The reusablePlugSetHash from armour 2.0's general socket.
 * TODO: Find a way to generate this in d2ai.
 */
export const generalSocketReusablePlugSetHash = 3559124992;

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
export const MIN_LO_ITEM_ENERGY = 7;
/**
 * The armor energy rules that Loadout Optimizer uses by default.
 * Requires a reasonable and inexpensive amount of upgrade materials.
 */
export const loDefaultArmorEnergyRules: ArmorEnergyRules = {
  lockArmorEnergyType: LockArmorEnergyType.None,
  assumeArmorMasterwork: AssumeArmorMasterwork.None,
  minItemEnergy: MIN_LO_ITEM_ENERGY,
};
/**
 * The armor energy rules that describe the changes DIM can
 * make in-game -- none as of now.
 */
export const inGameArmorEnergyRules: ArmorEnergyRules = {
  lockArmorEnergyType: LockArmorEnergyType.All,
  assumeArmorMasterwork: AssumeArmorMasterwork.None,
  minItemEnergy: 1,
};

/**
 * Rules describing how armor can change energy type and capacity
 * to accommodate mods and hit optimal stats.
 */
export interface ArmorEnergyRules {
  lockArmorEnergyType: LockArmorEnergyType;
  assumeArmorMasterwork: AssumeArmorMasterwork;
  /**
   * How much energy capacity items have at least.
   */
  minItemEnergy: number;
  /**
   * Info about other loadouts. This must be specified if `lockArmorEnergyType`
   * can be `LockArmorEnergyType.OtherLoadouts`.
   */
  loadouts?: {
    loadoutsByItem: LoadoutsByItem;
    optimizingLoadoutId: string | undefined;
  };
}
