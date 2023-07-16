import {
  Loadout as DimApiLoadout,
  LoadoutItem as DimApiLoadoutItem,
} from '@destinyitemmanager/dim-api-types';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DestinyLoadoutComponent } from 'bungie-api-ts/destiny2';

export type LoadoutItem = DimApiLoadoutItem & {
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
};

/** In memory loadout structure. */
export type Loadout = Omit<DimApiLoadout, 'equipped' | 'unequipped'> & {
  // All items are flattened out into LoadoutItems that keep track of whether they're equipped.
  items: LoadoutItem[];
};

/**
 * An in-game D2 loadout (post-Lightfall) decorated with enough data to equip it.
 *
 * TODO: Maybe converge this with DimLoadout instead of maintaining two. Especially if we add the icon/color/name to DimLoadout.
 */
export type InGameLoadout = DestinyLoadoutComponent & {
  /**
   * The index of the loadout in the list of the user's loadouts.
   *
   * 0-indexed and maxes out at 9, under the current game setup.
   * Make sure to add 1 for the loadout's display number.
   */
  index: number;

  /** What character this loadout is bound to. */
  characterId: string;

  /** The name of the loadout. From nameHash + DestinyLoadoutNameDefinition. */
  name: string;

  /** The loadout's icon foreground. From iconHash + DestinyLoadoutIconDefinition. */
  icon: string;

  /** The loadout's color / icon background. From colorHash + DestinyLoadoutColorDefinition. */
  colorIcon: string;

  /** An ID that should be unique among ingame and DIM loadouts. */
  id: string;
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
  readonly loadoutItem: LoadoutItem;

  /** This item wasn't found in inventory. This means `item` is a fake placeholder. */
  readonly missing?: boolean;
}

/**
 * Similarly to loadout items, mods can resolve to something different than what the hash says.
 * E.g. magic deprecated replacements, or reduced-cost copies.
 */
export interface ResolvedLoadoutMod {
  /** The original hash in the loadout. */
  readonly originalModHash: number;
  /** The resolved mod */
  readonly resolvedMod: PluggableInventoryItemDefinition;
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
  /**
   * The mutual exclusion group of the mod that will be plugged in this socket by the action.
   * Performing this plugging action requires that all sockets, including the targeted socket,
   * currently don't have a mod in this group plugged.
   */
  exclusionGroupAdded: string | undefined;
  /**
   * The mutual exclusion group of the mod that's currently plugged in the socket.
   * Performing this plugging action will remove one mod in this group.
   */
  exclusionGroupReleased: string | undefined;
}

export function isInGameLoadout(loadout: Loadout | InGameLoadout): loadout is InGameLoadout {
  return `colorHash` in loadout;
}
