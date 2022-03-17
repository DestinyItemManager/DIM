import { Loadout as DimApiLoadout } from '@destinyitemmanager/dim-api-types';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';

export interface LoadoutItem {
  /**
   * The item's id. There's no guarantee that the item this resolves to
   * actually has that id (subclasses, emblems, ...) so avoid accessing
   * it unless you know you're only looking at instanced items.
   */
  id: string;
  /**
   * The item's hash. There's also no guarantee that the resolved item
   * has this hash because we have migration from subclasses to their 3.0 form.
   */
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
 * Once we resolve a loadout item specifier to an actual item in inventory, we
 * can pass them around together. This represents the pair of the loadout item
 * specifier and the item in inventory (or fake placeholder item) that goes
 * along with it.
 */
export interface ResolvedLoadoutItem {
  /**
   * The actual item in inventory, wherever it is. This item will have any
   * socketOverrides and fashion from the loadoutItem applied to it.
   *
   * Note: Don't use the `equipped` property of this item - use `loadoutItem.equip` instead!
   */
  readonly item: DimItem;
  /**
   * The original loadout item specifier which says what we want to do with
   * this item in the loadout. Note that this loadoutItem may not have the same
   * id or even hash as the resolved item!
   */
  // TODO: remove this in favor of just equip/socketOverrides/amount?
  readonly loadoutItem: LoadoutItem;

  /** This item wasn't found in inventory. This means `item` is a fake placeholder. */
  readonly missing?: boolean;
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
