import { Loadout as DimApiLoadout } from '@destinyitemmanager/dim-api-types';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';

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

export type DimLoadoutItem = DimItem & LoadoutItem;

/** represents a single mod, and where to place it (on a non-specific item) */
export type Assignment = {
  /** what item to plug */
  mod: PluggableInventoryItemDefinition;
  /** which socket to plug it into */
  socketIndex: number;
};

/**
 * represents an Assignment which has been properly
 * ordered and given metadata, based on a specific item
 * and the delta between planned mods and current mods
 */
export type PluggingAction = {
  /** what item to plug */
  mod: PluggableInventoryItemDefinition;
  /** which socket to plug it into */
  socketIndex: number;
  /** This will be negative if we are recovering used energy back by swapping in a cheaper mod */
  energySpend: number;
  /**
   * if required, this instruction must be completed. the user wants this mod plugged.
   * if not, this is an optional action which clears out other mod slots
   */
  required: boolean;
};
