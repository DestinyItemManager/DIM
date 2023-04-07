import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import {
  D1ActivityComponent,
  D1FactionDefinition,
  D1RecordBook,
} from 'app/destiny1/d1-manifest-types';
import {
  DestinyClass,
  DestinyColor,
  DestinyDisplayPropertiesDefinition,
  DestinyProgression,
} from 'bungie-api-ts/destiny2';
import { D1Item, DimItem } from './item-types';

/**
 * A generic DIM character or vault - a "store" of items. This completely
 * represents any D2 store, and most properties of D1 stores, though you can
 * specialize down to the D1Store type for some special D1 properties and
 * overrides.
 */
export interface DimStore<Item = DimItem> {
  // Static data - these properties will never change after the character/store is created

  /** An ID for the store. Character ID or 'vault'. */
  id: string;
  /** Localized name for the store. */
  name: string;
  /** Is this the vault? */
  isVault: boolean;
  /** The Destiny version this store came from. */
  destinyVersion: DestinyVersion;
  /** Enum class type. */
  classType: DestinyClass;
  /** Localized class name. */
  className: string;
  /** Localized gender. */
  gender: string;
  /** Localized race. */
  race: string;
  /** Localized gender and race together. */
  genderRace: string;
  /** String gender name: 'male' | 'female' | '', used exclusively for i18n when translating to gendered languages */
  genderName: 'male' | 'female' | '';

  // "Mutable" data - this may be changed by moving the item around, lock/unlock, etc. Any place DIM updates its view of the world without a profile refresh.

  /** All items in the store, across all buckets. */
  items: readonly Item[];

  // Dynamic data - this may change between profile updates, (whether that's full or partial profile update)

  /** An icon (emblem) for the store. */
  icon: string;
  /** Is this the most-recently-played character? */
  current: boolean;
  /** The date the character was last played. */
  lastPlayed: Date;
  /** Emblem background image */
  background: string;
  /** The background or dominant color of the equipped emblem, if available. */
  color?: DestinyColor;
  /** Character level. */
  level: number;
  /** Progress towards the next level (or "prestige level") */
  percentToNextLevel: number;
  /** The Bungie.net-reported power level */
  powerLevel: number;
  /** The record corresponding to the currently equipped Title. */
  titleInfo?: DimTitle;
  /** Character stats. */
  stats: {
    [hash: number]: DimCharacterStat;
  };
  /** Did any of the items in the last inventory build fail? */
  hadErrors: boolean;
}

export interface DimTitle {
  title: string;
  gildedNum: number;
  isGildedForCurrentSeason: boolean;
}

/** Account-wide currency counts, e.g. glimmer */
export interface AccountCurrency {
  readonly itemHash: number;
  readonly displayProperties: DestinyDisplayPropertiesDefinition;
  readonly quantity: number;
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

  /** A localized description of this stat's effect. */
  effect?: string;
  /** Cooldown time for the associated ability. */
  cooldown?: string;
}

export interface D1Progression extends DestinyProgression {
  /** The faction definition associated with this progress. */
  faction: D1FactionDefinition;
  order: number;
}

/**
 * A D1 character. Use this when you need D1-specific properties or D1-specific items.
 */
export interface D1Store extends DimStore<D1Item> {
  progressions: D1Progression[];

  // TODO: shape?
  advisors: {
    recordBooks?: D1RecordBook[];
    activities?: { [activityId: string]: D1ActivityComponent };
  };
}
