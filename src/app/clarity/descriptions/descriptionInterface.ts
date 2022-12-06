export interface LinesContent {
  text?: string;
  classNames?: string[];
  link?: string;
}
export interface Line {
  linesContent?: LinesContent[];
  classNames?: string[];
}

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

  descriptions: {
    [key in Languages]?: Line[];
  };
}

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
