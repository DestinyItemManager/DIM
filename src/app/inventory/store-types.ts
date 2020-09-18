import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import {
  DestinyClass,
  DestinyColor,
  DestinyDisplayPropertiesDefinition,
  DestinyFactionDefinition,
  DestinyProgression,
} from 'bungie-api-ts/destiny2';
import { InventoryBucket } from './inventory-buckets';
import { D1Item, DimItem } from './item-types';

/**
 * A generic DIM character or vault - a "store" of items. This completely
 * represents any D2 store, and most properties of D1 stores, though you can
 * specialize down to the D1Store type for some special D1 properties and
 * overrides.
 */
export interface DimStore<Item = DimItem> {
  /** An ID for the store. Character ID or 'vault'. */
  id: string;
  /** Localized name for the store. */
  name: string;
  /** All items in the store, across all buckets. */
  items: readonly Item[];
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

  /** The vault associated with this store. */
  vault?: DimVault;
  color?: DestinyColor;
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
}
