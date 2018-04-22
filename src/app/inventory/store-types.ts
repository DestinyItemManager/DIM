import {
  DestinyClass,
  DestinyProgression,
  DestinyCharacterComponent
} from 'bungie-api-ts/destiny2';
import { Loadout } from '../loadout/loadout.service';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { IPromise } from 'angular';
import { DimItem, D2Item, D1Item } from './item-types';
import { D2InventoryBucket } from '../destiny2/d2-buckets.service';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable';

// TODO: maybe break these out into separate files for D1/D2?

export interface StoreServiceType {
  getActiveStore(): DimStore | undefined;
  getStores(): DimStore[];
  getStore(id: string): DimStore | undefined;
  getVault(): DimVault | undefined;
  getAllItems(): DimItem[];
  getStoresStream(account: DestinyAccount): ConnectableObservable<DimStore[] | undefined>;
  getItemAcrossStores(params: {
    id?: string;
    hash?: number;
    notransfer?: boolean;
  }): DimItem | undefined;
  updateCharacters(account?: DestinyAccount): IPromise<DimStore[]>;
  reloadStores(): Promise<DimStore[] | undefined>;
  refreshRatingsData(): void;
}

export interface D2StoreServiceType extends StoreServiceType {
  getActiveStore(): D2Store | undefined;
  getStores(): D2Store[];
  getStore(id: string): D2Store | undefined;
  getVault(): D2Vault | undefined;
  getAllItems(): D2Item[];
  getStoresStream(account: DestinyAccount): ConnectableObservable<D2Store[] | undefined>;
  getItemAcrossStores(params: {
    id?: string;
    hash?: number;
    notransfer?: boolean;
  }): D2Item | undefined;
  updateCharacters(account?: DestinyAccount): IPromise<D2Store[]>;
  reloadStores(): Promise<D2Store[] | undefined>;
  refreshRatingsData(): void;
}

export interface D1StoreServiceType extends StoreServiceType {
  getActiveStore(): D1Store | undefined;
  getStores(): D1Store[];
  getStore(id: string): D1Store | undefined;
  getVault(): D1Vault | undefined;
  getAllItems(): D1Item[];
  getStoresStream(account: DestinyAccount): ConnectableObservable<D1Store[] | undefined>;
  getItemAcrossStores(params: {
    id?: string;
    hash?: number;
    notransfer?: boolean;
  }): D1Item | undefined;
  updateCharacters(account?: DestinyAccount): IPromise<D1Store[]>;
  reloadStores(): Promise<D1Store[] | undefined>;
  refreshRatingsData(): void;
}

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

  isDestiny1(): this is D1Store;
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

export interface D1Store extends DimStore {
  items: D1Item[];
  stats: {
    [statHash: string]: D1CharacterStat;
  };

  // TODO: shape?
  progression: any;
  advisors: any;

  updateCharacterInfo(
    defs: D1ManifestDefinitions,
    bStore: any
  ): IPromise<D1Store[]>;
  updateCharacterInfoFromEquip(characterInfo);
  factionAlignment();
}

export interface D2Store extends DimStore {
  items: D2Item[];
  vault?: D2Vault;
  stats: {
    [hash: number]: D2CharacterStat;
  };
  progression: null | {
    progressions: { [key: number]: DestinyProgression };
  };
  updateCharacterInfo(
    defs: D2ManifestDefinitions,
    bStore: DestinyCharacterComponent
  ): IPromise<D2Store[]>;
}
