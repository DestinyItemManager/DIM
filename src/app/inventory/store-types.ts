import {
  DestinyClass,
  DestinyProgression,
  DestinyCharacterComponent,
  DestinyFactionDefinition
} from 'bungie-api-ts/destiny2';
import { Loadout } from '../loadout/loadout.service';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { IPromise } from 'angular';
import { DimItem, D2Item, D1Item } from './item-types';
import { D2InventoryBucket } from '../destiny2/d2-buckets.service';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable';
import { DimInventoryBucket } from './inventory-types';

// TODO: maybe break these out into separate files for D1/D2?

/**
 * A generic store service that produces stores and items that are the same across D1 and D2. Use this
 * if you don't care about the differences between the two.
 */
export interface StoreServiceType<StoreType = DimStore, VaultType = DimVault, ItemType = DimItem> {
  getActiveStore(): StoreType | undefined;
  getStores(): StoreType[];
  getStore(id: string): StoreType | undefined;
  getVault(): VaultType | undefined;
  getAllItems(): ItemType[];
  getStoresStream(account: DestinyAccount): ConnectableObservable<StoreType[] | undefined>;
  getItemAcrossStores(params: {
    id?: string;
    hash?: number;
    notransfer?: boolean;
  }): ItemType | undefined;
  updateCharacters(account?: DestinyAccount): IPromise<StoreType[]>;
  reloadStores(): Promise<StoreType[] | undefined>;
  refreshRatingsData(): void;
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
  id: string;
  name: string;
  items: DimItem[];
  buckets: { [bucketId: string]: DimItem[] };

  destinyVersion: 1 | 2;
  icon: string;
  current: boolean;
  lastPlayed: Date;
  background: string;
  level: number;
  percentToNextLevel: number;
  powerLevel: number;
  class: 'titan' | 'warlock' | 'hunter';
  classType: DestinyClass;
  className: string;
  gender: string;
  genderRace: string;
  isVault: boolean;
  stats: {};
  progression: null | {
    progressions: DestinyProgression[];
  };

  updateCharacterInfo(
    defs: D1ManifestDefinitions | D2ManifestDefinitions,
    bStore: any
  ): IPromise<DimStore[]>;

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

  addItem(item: DimItem): void;

  // Create a loadout from this store's equipped items
  // TODO: Loadout type
  loadoutFromCurrentlyEquipped(name: string): Loadout;

  /**
   * Check if this store is from D1. Inside an if statement, this item will be narrowed to type D1Store.
   */
  isDestiny1(): this is D1Store;
  /**
   * Check if this store is from D2. Inside an if statement, this item will be narrowed to type D2Store.
   */
  isDestiny2(): this is D2Store;
}

export interface DimVault extends DimStore {
  vaultCounts: { [category: string]: number };

  legendaryMarks: number;
  glimmer: number;
  silver: number;
}

export interface D1Vault extends D1Store {
  vaultCounts: { [category: string]: number };

  legendaryMarks: number;
  glimmer: number;
  silver: number;
}

export interface D2Vault extends D2Store {
  d2VaultCounts: {
    [bucketId: number]: { count: number; bucket: D2InventoryBucket };
  };
  vaultCounts: { [category: string]: number };

  legendaryMarks: number;
  glimmer: number;
  silver: number;
}

export interface D2CharacterStat {
  id: number;
  name: string;
  description: string;
  value: number;
  icon: string;
}

export interface D1CharacterStat {
  id: string;
  name?: string;
  icon?: string;
  value: number;

  effect?: string;
  normalized?: number;
  tier?: number;
  tierMax?: number;
  tiers?: number[];
  remaining?: number;
  cooldown?: string;
  percentage?: string;
}

export interface D1Progression extends DestinyProgression {
  faction: DestinyFactionDefinition;
}

/**
 * A D1 character. Use this when you need D1-specific properties or D1-specific items.
 */
export interface D1Store extends DimStore {
  items: D1Item[];
  buckets: { [bucketId: string]: D1Item[] };
  stats: {
    [statHash: string]: D1CharacterStat;
  };
  progression: null | {
    progressions: D1Progression[];
  };

  // TODO: shape?
  advisors: any;

  updateCharacterInfo(
    defs: D1ManifestDefinitions,
    bStore: any
  ): IPromise<D1Store[]>;
  updateCharacterInfoFromEquip(characterInfo);
  factionAlignment();
}

/**
 * A D2 character. Use this when you need D2-specific properties or D2-specific items.
 */
export interface D2Store extends DimStore {
  items: D2Item[];
  buckets: { [bucketId: string]: D2Item[] };
  vault?: D2Vault;
  stats: {
    [hash: number]: D2CharacterStat;
  };
  updateCharacterInfo(
    defs: D2ManifestDefinitions,
    bStore: DestinyCharacterComponent
  ): IPromise<D2Store[]>;
}
