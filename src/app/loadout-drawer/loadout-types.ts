import { Loadout as DimApiLoadout } from '@destinyitemmanager/dim-api-types';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';

export interface LoadoutItem {
  id: string;
  hash: number;
  amount: number;
  equipped: boolean;
  /**
   * A map of socketIndex's to item hashes for plugs that override the current items plugs in
   * the loadout.
   */
  socketOverrides?: { [socketIndex: number]: number };
}

/** In memory loadout structure. */
export type Loadout = Omit<DimApiLoadout, 'equipped' | 'unequipped'> & {
  // All items are flattened out into LoadoutItems that keep track of whether they're equipped.
  items: LoadoutItem[];
};

/**
 * This merges data from DimItem and LoadoutItem so we don't need to pass both objects around as
 * a pair.
 */
export interface DimLoadoutItem extends DimItem {
  /**
   * A map of socketIndex's to item hashes for plugs that override the current items plugs in
   * the loadout.
   */
  socketOverrides?: { [socketIndex: number]: number };
}

/** represents a single mod, and where to place it (on a non-specific item) */
export interface Assignment {
  // TODO: just the hash?
  /** what item to plug */
  mod: PluggableInventoryItemDefinition;
  /** which socket to plug it into */
  socketIndex: number;
  /**
   * If required, this assignment must be completed. The user wants this mod plugged, even if it's the default plug.
   * If not, this is an optional action which clears out other mod slots.
   * This also controls whether we show the status of this assigment in the loadout progress notification.
   */
  required: boolean;
}

/**
 * Represents an Assignment which has been properly
 * ordered and given metadata, based on a specific item
 * and the delta between planned mods and current mods
 */
export interface PluggingAction extends Assignment {
  /** This will be negative if we are recovering used energy back by swapping in a cheaper mod */
  energySpend: number;
}
