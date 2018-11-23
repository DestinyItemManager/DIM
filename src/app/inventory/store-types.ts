import {
  DestinyClass,
  DestinyProgression,
  DestinyCharacterComponent,
  DestinyFactionDefinition,
  DestinyColor
} from 'bungie-api-ts/destiny2';
import { Loadout } from '../loadout/loadout.service';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { DimItem, D2Item, D1Item } from './item-types';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable';
import { InventoryBucket } from './inventory-buckets';

/**
 * A generic store service that produces stores and items that are the same across D1 and D2. Use this
 * if you don't care about the differences between the two.
 */
export interface StoreServiceType<StoreType = DimStore, VaultType = DimVault, ItemType = DimItem> {
  /** Get the active or last-played character. */
  getActiveStore(): StoreType | undefined;
  /** Get a list of all characters plus the vault. */
  getStores(): StoreType[];
  /** Get a store by character ID. */
  getStore(id: string): StoreType | undefined;
  /** Get the vault. */
  getVault(): VaultType | undefined;
  /** Get all items across all stores. */
  getAllItems(): ItemType[];
  /** A stream of store updates for a particular account. */
  getStoresStream(account: DestinyAccount): ConnectableObservable<StoreType[] | undefined>;
  /** Get an item matching certain characteristics, no matter where it is in inventory. */
  getItemAcrossStores(params: {
    id?: string;
    hash?: number;
    notransfer?: boolean;
    amount?: number;
  }): ItemType | undefined;
  /** Refresh just character info (current light/stats, etc.) */
  updateCharacters(account?: DestinyAccount): Promise<StoreType[]>;
  /** Reload inventory completely. */
  reloadStores(): Promise<StoreType[] | undefined>;
  /** Reload DTR rating data. */
  refreshRatingsData(): void;

  /** Tell Redux things have changed. Temporary bridge for Redux. */
  touch(): void;
}

/**
 * A Destiny 2 store service. This will use D2 types everywhere, avoiding the need to check.
 */
export type D2StoreServiceType = StoreServiceType<D2Store, D2Vault, D2Item>;

/**
 * A Destiny 1 store service. This will use D1 types everywhere, avoiding the need to check.
 */
export type D1StoreServiceType = StoreServiceType<D1Store, D1Vault, D1Item>;

/**
 * A generic DIM character or vault - a "store" of items. Use this type when you can handle both D1 and D2 characters,
 * or you don't use anything specific to one of them.
 */
export interface DimStore {
  /** An ID for the store. Character ID or 'vault'. */
  id: string;
  /** Localized name for the store. */
  name: string;
  /** All items in the store, across all buckets. */
  items: DimItem[];
  /** All items, grouped by their bucket. */
  buckets: { [bucketId: string]: DimItem[] };
  /** The Destiny version this store came from. */
  destinyVersion: 1 | 2;
  /** An icon (emblem) for the store. */
  icon: string;
  /** Is this the most-recently-played character? */
  current: boolean;
  /** The date the character was last played. */
  lastPlayed: Date;
  /** Emblem background. */
  background: string;
  /** Character level. */
  level: number;
  /** Progress towards the next level (or "prestige level") */
  percentToNextLevel: number;
  /** Power/light level. */
  powerLevel: number;
  /** String class name. */
  class: 'titan' | 'warlock' | 'hunter' | 'vault';
  /** Integer class type. */
  classType: DestinyClass;
  /** Localized class name. */
  className: string;
  /** Localized gender. */
  gender: string;
  /** Localized gender and race together. */
  genderRace: string;
  /** Is this the vault? */
  isVault: boolean;
  /** Character stats. */
  stats: {};
  /** Character progression. */
  progression: null | {
    progressions: DestinyProgression[];
  };

  /** Apply updated character info. */
  updateCharacterInfo(
    defs: D1ManifestDefinitions | D2ManifestDefinitions,
    bStore: any
  ): Promise<DimStore[]>;

  /**
   * Get the total amount of this item in the store, across all stacks,
   * excluding stuff in the postmaster.
   */
  amountOfItem(item: DimItem): number;
  /**
   * How much of items like this item can fit in this store? For
   * stackables, this is in stacks, not individual pieces.
   */
  capacityForItem(item: DimItem): number;
  /**
   * How many *more* items like this item can fit in this store?
   * This takes into account stackables, so the answer will be in
   * terms of individual pieces.
   */
  spaceLeftForItem(item: DimItem): number;

  /** Remove an item from this store. Returns whether it actually removed anything. */
  removeItem(item: DimItem): boolean;

  /** Add an item to the store. */
  addItem(item: DimItem): void;

  /** Create a loadout from this store's equipped items. */
  loadoutFromCurrentlyEquipped(name: string): Loadout;

  /** Check if this store is from D1. Inside an if statement, this item will be narrowed to type D1Store. */
  isDestiny1(): this is D1Store;
  /* Check if this store is from D2. Inside an if statement, this item will be narrowed to type D2Store. */
  isDestiny2(): this is D2Store;

  /** The stores service associated with this store. */
  getStoresService(): StoreServiceType;

  /** A temporary way of telling Redux that something about the stores has changed. */
  touch(): void;
}

/** How many items are in each vault bucket. DIM hides the vault bucket concept from users but needs the count to track progress. */
interface VaultCounts {
  [bucketId: number]: { count: number; bucket: InventoryBucket };
}

export interface DimVault extends DimStore {
  vaultCounts: VaultCounts;
  legendaryMarks: number;
  glimmer: number;
  silver: number;
}

export interface D1Vault extends D1Store {
  vaultCounts: VaultCounts;
  legendaryMarks: number;
  glimmer: number;
  silver: number;
}

export interface D2Vault extends D2Store {
  vaultCounts: VaultCounts;
  legendaryMarks: number;
  glimmer: number;
  silver: number;
}

export interface D2CharacterStat {
  /** The DestinyStatDefinition hash for the stat. */
  id: number;
  /** The localized name of the stat. */
  name: string;
  /** The localized description of the stat. */
  description: string;
  /** The current value of the stat. */
  value: number | string;
  /** An icon associated with the stat. */
  icon: string;
  /** The size of one "tier" of the stat (for D1 stats) */
  tierMax?: number;
  /** The stat divided into tiers. Each element is how full that tier is. */
  tiers?: number[] | string[];
  /** Whether this stat is inaccurate because it relies on classified items (like base power). */
  hasClassified?: boolean;
}

export interface D1CharacterStat {
  /** Stat identifier (e.g. "STAT_INTELLECT") */
  id: string;
  /** The localized name of the stat. */
  name?: string;
  /** An icon associated with the stat. */
  icon?: string;
  /** The current value of the stat. */
  value: number;

  /** A localized description of this stat's effect. */
  effect?: string;
  /** The stat value, clamped to <300. TODO: what is this? */
  normalized?: number;
  /** Which tier (out of 5) has been activated. */
  tier?: number;
  /** The size of one "tier" of the stat (for D1 stats) */
  tierMax?: number;
  /** The stat divided into tiers. Each element is how full that tier is. */
  tiers?: number[];
  /** TODO: remove this and normalized */
  remaining?: number;
  /** Cooldown time for the associated ability. */
  cooldown?: string;
  /** Percentage of maximum stat value. */
  percentage?: string;
}

export interface D1Progression extends DestinyProgression {
  /** The faction definition associated with this progress. */
  faction: DestinyFactionDefinition & {
    factionName: string;
    factionIcon: string;
  };
  order: number;
}

/**
 * A D1 character. Use this when you need D1-specific properties or D1-specific items.
 */
export interface D1Store extends DimStore {
  items: D1Item[];
  buckets: { [bucketId: string]: D1Item[] };
  stats: {
    [hash: string]: D1CharacterStat;
  };
  progression: null | {
    progressions: D1Progression[];
  };

  // TODO: shape?
  advisors: any;

  updateCharacterInfo(defs: D1ManifestDefinitions, bStore: any): Promise<D1Store[]>;
  updateCharacterInfoFromEquip(characterInfo);
  /** Which faction is this character currently aligned with? */
  factionAlignment();
  getStoresService(): D1StoreServiceType;
}

/**
 * A D2 character. Use this when you need D2-specific properties or D2-specific items.
 */
export interface D2Store extends DimStore {
  items: D2Item[];
  buckets: { [bucketId: string]: D2Item[] };
  /** The vault associated with this store. */
  vault?: D2Vault;
  color: DestinyColor;
  stats: {
    maxBasePower?: D2CharacterStat;
    [statHash: number]: D2CharacterStat;
  };
  updateCharacterInfo(
    defs: D2ManifestDefinitions,
    bStore: DestinyCharacterComponent
  ): Promise<D2Store[]>;
  getStoresService(): D1StoreServiceType;
}
