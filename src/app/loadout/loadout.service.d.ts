import { DimItem } from '../inventory/store/d2-item-factory.service';

export const enum LoadoutClass {
  any = -1,
  warlock = 0,
  titan = 1,
  hunter = 2
}

// TODO: move into loadouts service
export interface Loadout {
  id: string;
  classType: LoadoutClass;
  name: string;
  items: { [type: string]: DimItem[] };
}