import { Loadout as DimApiLoadout } from '@destinyitemmanager/dim-api-types';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';

export interface LoadoutItem {
  id: string;
  hash: number;
  amount: number;
  /** Whether or not the item should be equipped when the loadout is applied. */
  equip: boolean;
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
  /** what item to plug */
  mod: PluggableInventoryItemDefinition;
  /** which socket to plug it into */
  socketIndex: number;
  /** Was this assignment requested by the user (and should thus be reported in the progress popup)? */
  requested: boolean;
}

/**
 * Represents an Assignment which has been properly
 * ordered and given metadata, based on a specific item
 * and the delta between planned mods and current mods
 */
export interface PluggingAction extends Assignment {
  /** This will be negative if we are recovering used energy back by swapping in a cheaper mod */
  energySpend: number;
  /**
   * If required, this assignment must be completed.
   * If not, this is an optional action which clears out other mod slots.
   */
  required: boolean;
}
