import { DimLanguage } from 'app/i18n';

export type DescriptionClassNames =
  | 'background'
  | 'blue'
  | 'bold'
  | 'breakSpaces'
  | 'center'
  | 'communityDescription'
  | 'descriptionDivider'
  | 'enhancedArrow'
  | 'green'
  | 'link'
  | 'purple'
  | 'pve'
  | 'pvp'
  | 'spacer'
  | 'title'
  | 'yellow';

export interface LinesContent {
  text?: string;
  classNames?: DescriptionClassNames[];
  link?: string;
}
export interface Line {
  linesContent?: LinesContent[];
  classNames?: DescriptionClassNames[];
}

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
    [key in DimLanguage]?: Line[];
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
