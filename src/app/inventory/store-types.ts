import {
  DestinyClass,
  DestinyProgression,
  DestinyFactionDefinition,
  DestinyColor,
  DestinyDisplayPropertiesDefinition,
} from 'bungie-api-ts/destiny2';
import { DimItem, D2Item, D1Item } from './item-types';
import { DestinyAccount } from '../accounts/destiny-account';
import { InventoryBucket } from './inventory-buckets';
import { ConnectableObservable } from 'rxjs';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';

/**
 * A generic store service that produces stores and items that are the same across D1 and D2. Use this
 * if you don't care about the differences between the two.
 */
export interface StoreServiceType<StoreType = DimStore> {
  /** Get a list of all characters plus the vault. */
  getStores(): StoreType[];
  /** A stream of store updates for a particular account. */
  getStoresStream(account: DestinyAccount): ConnectableObservable<StoreType[] | undefined>;
  /** Reload inventory completely. */
  reloadStores(): Promise<StoreType[] | undefined>;
}

/**
 * A Destiny 2 store service. This will use D2 types everywhere, avoiding the need to check.
 */
export type D2StoreServiceType = StoreServiceType<D2Store>;

/**
 * A Destiny 1 store service. This will use D1 types everywhere, avoiding the need to check.
 */
export type D1StoreServiceType = StoreServiceType<D1Store>;

/**
 * A generic DIM character or vault - a "store" of items. Use this type when you can handle both D1 and D2 characters,
 * or you don't use anything specific to one of them.
 */
export interface DimStore<Item = DimItem> {
  /** An ID for the store. Character ID or 'vault'. */
  id: string;
  /** Localized name for the store. */
  name: string;
  /** All items in the store, across all buckets. */
  items: Item[];
  /** All items, grouped by their bucket. */
  buckets: { [bucketHash: number]: Item[] };
  /** The Destiny version this store came from. */
  destinyVersion: DestinyVersion;
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
  /** Enum class type. */
  classType: DestinyClass;
  /** Localized class name. */
  className: string;
  /** Localized gender. */
  gender: string;
  /** Localized gender and race together. */
  genderRace: string;
  /** String gender name: 'male' | 'female' | '' */
  genderName: 'male' | 'female' | '';
  /** Is this the vault? */
  isVault: boolean;
  /** Character stats. */
  stats: {
    /** average of your highest simultaneously equippable gear with bonus fields for rich tooltip content and equippability warnings */
    maxGearPower?: DimCharacterStat;
    /** currently represents the power level bonus provided by the Seasonal Artifact */
    powerModifier?: DimCharacterStat;
    /** maxGearPower + powerModifier. the highest PL you can get your inventory screen to show */
    maxTotalPower?: DimCharacterStat;
    [hash: number]: DimCharacterStat;
  };
  /** Character progression. */
  progression: null | {
    progressions: DestinyProgression[];
  };

  /**
   * Get the total amount of this item in the store, across all stacks,
   * excluding stuff in the postmaster.
   */
  amountOfItem(item: { hash: number }): number;
  /**
   * How much of items like this item can fit in this store? For
   * stackables, this is in stacks, not individual pieces.
   */
  capacityForItem(item: Item): number;
  /**
   * How many *more* items like this item can fit in this store?
   * This takes into account stackables, so the answer will be in
   * terms of individual pieces.
   */
  spaceLeftForItem(item: Item): number;

  /** Remove an item from this store. Returns whether it actually removed anything. */
  removeItem(item: Item): boolean;

  /** Add an item to the store. */
  addItem(item: Item): void;

  /** Check if this store is from D1. Inside an if statement, this item will be narrowed to type D1Store. */
  isDestiny1(): this is D1Store;
  /* Check if this store is from D2. Inside an if statement, this item will be narrowed to type D2Store. */
  isDestiny2(): this is D2Store;

  /** The stores service associated with this store. */
  getStoresService(): StoreServiceType;
}

/** How many items are in each vault bucket. DIM hides the vault bucket concept from users but needs the count to track progress. */
interface VaultCounts {
  [bucketHash: number]: { count: number; bucket: InventoryBucket };
}

export interface DimVault extends DimStore {
  vaultCounts: VaultCounts;
  currencies: {
    itemHash: number;
    displayProperties: DestinyDisplayPropertiesDefinition;
    quantity: number;
  }[];
}

export interface D1Vault extends D1Store {
  vaultCounts: VaultCounts;
  currencies: {
    itemHash: number;
    displayProperties: DestinyDisplayPropertiesDefinition;
    quantity: number;
  }[];
}

export interface D2Vault extends D2Store {
  vaultCounts: VaultCounts;
  currencies: {
    itemHash: number;
    displayProperties: DestinyDisplayPropertiesDefinition;
    quantity: number;
  }[];
}

/** A character-level stat. */
export interface DimCharacterStat {
  /** The DestinyStatDefinition hash for the stat. */
  hash: number;
  /** The localized name of the stat. */
  name: string;
  /** An icon associated with the stat. */
  icon?: string;
  /** The current value of the stat. */
  value: number;

  /** The localized description of the stat. */
  description: string;
  /** Whether this stat is inaccurate because it relies on classified items (like base power). */
  hasClassified?: boolean;

  /** maxGearPower (hash `-3`) may have this. if it's set, it's the *equippable* max power (instead of all items' combined max) */
  differentEquippableMaxGearPower?: number;
  /** additional rich content available to display in a stat's tooltip */
  richTooltip?: JSX.Element;

  /** A localized description of this stat's effect. */
  effect?: string;
  /** Cooldown time for the associated ability. */
  cooldown?: string;
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
export interface D1Store extends DimStore<D1Item> {
  progression: null | {
    progressions: D1Progression[];
  };

  // TODO: shape?
  advisors: any;

  /** Which faction is this character currently aligned with? */
  factionAlignment(): void;
  getStoresService(): D1StoreServiceType;
}

/**
 * A D2 character. Use this when you need D2-specific properties or D2-specific items.
 */
export interface D2Store extends DimStore<D2Item> {
  /** The vault associated with this store. */
  vault?: D2Vault;
  color: DestinyColor;
  getStoresService(): D1StoreServiceType;
}
