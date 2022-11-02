export interface LinesContent {
  text?: string;
  className?: string[];
  linkUrl?: string;
  linkText?: string;
  title?: string;
}
export interface Line {
  linesContent?: LinesContent[];
  classNames?: string[];
}
type PerkTypes =
  | 'armorExotic'
  | 'weaponPerkExotic'
  | 'weaponFrameExotic'
  | 'weaponCatalystExotic'
  // ---------
  | 'weaponPerk'
  | 'weaponPerkEnhanced'
  | 'weaponOriginTrait'
  | 'weaponFrame'
  // ---------
  | 'fragment'
  | 'aspect'
  | 'super'
  | 'grenade'
  | 'melee'
  | 'class'
  | 'movement'
  // ---------
  | 'armorModGeneral'
  | 'armorModCombat'
  | 'armorModActivity'
  | 'armorModSeasonal'
  | 'weaponMod'
  | 'ghostMod'
  | 'artifactMod'
  // ---------
  | 'none';

export type Languages =
  /** English - English */
  | 'en'
  /** German - Deutsch */
  | 'de'
  /** French - Français */
  | 'fr'
  /** Italian - Italiano */
  | 'it'
  /** Polish - Polski */
  | 'pl'
  /** Russian - Русский */
  | 'ru'
  /** Spanish (Spain) - Español (España) */
  | 'es'
  /** Spanish (Mexico) - Español (México) */
  | 'es-mx'
  /** Korean - 한국어 */
  | 'ko'
  /** Portuguese (Brazil) - Português (Brasil) */
  | 'pt-rb'
  /** Japanese - 日本語 */
  | 'ja'
  /** Chinese (Traditional) - 繁體中文 */
  | 'zh-cht'
  /** Chinese (Simplified) - 简体中文 */
  | 'zh-chs';

/**
 * Clarity perk
 */
export interface Perk {
  /**
   * Perk hash from inventoryItems
   */
  hash: number;
  /**
   * Perk name from inventoryItems
   */
  name: string;

  /**
   * Exotic armor / weapon hash from inventoryItems
   */
  itemHash?: number;
  /**
   * Exotic armor / weapon name from inventoryItems
   */
  itemName?: string;

  /**
   * Basically is this armor mod, exotic weapon perk, catalyst, etc
   */
  type: PerkTypes;

  descriptions: {
    [key in Languages]?: Line[];
  };

  /**
   * Optional description most likely investment stats only
   */
  optional?: boolean;

  /**
   * Then last time perk was updated time in ms (Date.now())
   */
  lastUpdate: number;
}

// {
//   description: 'content of perk description booth simple and normal',
// }
// will be changed to
// {
//   descriptions: {
//     en: 'description content',
//     de: 'description content',
//     fr: 'description content',
//     es: 'description content',
//     it: 'description content',
//     pl: 'description content',
//   }
// }
// langues listed hare are just place holders for now except en that will be obviously in where
// new one comming will be Chinese

export interface ClarityDescription {
  /**
   ** Key is always inventory item perk hash
   */
  [key: number]: Perk;
}

export interface ClarityVersions {
  /**
   ** Version format x.y
   ** x - major version requiring update to DIM
   ** y - minor version just simple update to description
   */
  descriptions: number;
}
