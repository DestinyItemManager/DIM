export interface LinesContent {
  text?: string;
  className?: string;
  linkUrl?: string;
  linkText?: string;
  title?: string;
}
export interface Line {
  lineText?: LinesContent[];
  className?: string;
}
type PerkType =
  | 'armorExotic'
  | 'armorMod'
  // ---------
  | 'weaponPerkExotic'
  | 'weaponFrameExotic'
  | 'weaponPerk'
  | 'weaponPerkEnhanced'
  | 'weaponFrame'
  | 'weaponMod'
  | 'weaponCatalystExotic'
  // ---------
  | 'ghostMod';

interface Perk {
  /**
   * Perk hash from inventoryItems
   */
  id: number;
  /**
   * Perk name from inventoryItems
   */
  name: string;

  /**
   * Exotic armor / weapon hash from inventoryItems
   */
  itemId?: number;
  /**
   * Exotic armor / weapon name from inventoryItems
   */
  itemName?: string;

  /**
   * Basically is this armor mod, exotic weapon perk, catalyst, etc
   */
  type: PerkType;

  description: Line[];
  simpleDescription?: Line[];

  /**
   * Community gathered stats that are not provided by Bungie
   */
  stats?: { [key: string]: any };

  /**
   * Description with stats only (not needed in DIM)
   */
  statOnly?: boolean;

  /**
   * Then last time perk was updated time in ms (Date.now())
   */
  lastUpdate: number;
  /**
   * Name of person who updated this perk so we know who to blame
   */
  updatedBy: string;
}

export interface ClarityDescription {
  /**
   ** Key is always inventory item perk hash
   */
  [key: number]: Perk;
}

export interface ClarityVersions {
  /**
   * version format 1.0
   */
  descriptions: number;
}
