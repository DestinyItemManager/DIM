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
  id: number;
  name: string;

  itemId?: number;
  itemName?: string;

  type: PerkType;

  description: Line[];
  simpleDescription?: Line[];

  stats?: { [key: string]: any };

  lastUpdate: number;
  updatedBy: string;
}

export interface ClarityDescription {
  [key: number]: Perk;
}
