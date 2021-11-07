import { Loadout as DimApiLoadout } from '@destinyitemmanager/dim-api-types';

export interface LoadoutItem {
  id: string;
  hash: number;
  amount: number;
  equipped: boolean;
  socketOverrides?: { [socketIndex: number]: number };
}

/** In memory loadout structure. */
export type Loadout = Omit<DimApiLoadout, 'equipped' | 'unequipped'> & {
  // All items are flattened out into LoadoutItems that keep track of whether they're equipped.
  items: LoadoutItem[];
};
