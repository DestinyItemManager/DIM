import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';

export interface LoadoutItem {
  id: string;
  hash: number;
  amount: number;
  equipped: boolean;
  socketOverrides?: number[];
}

/** In memory loadout structure. */
export interface Loadout {
  id: string;
  classType: DestinyClass;
  name: string;
  items: LoadoutItem[];
  /** Whether to move other items not in the loadout off the character when applying the loadout. */
  clearSpace?: boolean;
  /** Information about the desired properties of this loadout - used to drive the Loadout Optimizer or apply Mod Loadouts */
  parameters?: LoadoutParameters;
}
