import { DestinyClass } from 'bungie-api-ts/destiny2';
import { DimItem } from 'app/inventory/item-types';

export enum LoadoutClass {
  any = -1,
  warlock = 0,
  titan = 1,
  hunter = 2
}

export const loadoutClassToClassType = {
  [LoadoutClass.hunter]: DestinyClass.Hunter,
  [LoadoutClass.titan]: DestinyClass.Titan,
  [LoadoutClass.warlock]: DestinyClass.Warlock,
  [LoadoutClass.any]: DestinyClass.Unknown
};

export const classTypeToLoadoutClass = {
  [DestinyClass.Hunter]: LoadoutClass.hunter,
  [DestinyClass.Titan]: LoadoutClass.titan,
  [DestinyClass.Warlock]: LoadoutClass.warlock,
  [DestinyClass.Unknown]: LoadoutClass.any
};

export function getLoadoutClassDisplay(loadoutClass: LoadoutClass) {
  switch (loadoutClass) {
    case 0:
      return 'warlock';
    case 1:
      return 'titan';
    case 2:
      return 'hunter';
  }
  return 'any';
}

export type LoadoutItem = DimItem;

/** In memory loadout structure. */
export interface Loadout {
  id: string;
  classType: LoadoutClass;
  name: string;
  items: {
    [type: string]: LoadoutItem[];
  };
  /** Platform membership ID this loadout is associated with */
  membershipId?: string;
  destinyVersion?: 1 | 2;
  // TODO: deprecate this
  platform?: string;
  /** Whether to move other items not in the loadout off the character when applying the loadout. */
  clearSpace?: boolean;
}
