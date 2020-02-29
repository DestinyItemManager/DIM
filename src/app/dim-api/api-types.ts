import { Settings } from 'app/settings/reducer';
import { TagValue } from 'app/inventory/dim-item-info';
import { DestinyClass } from 'bungie-api-ts/destiny2';

/**
 * Global DIM platform settings from the DIM API.
 */
export interface GlobalSettings {
  /** Whether to use the DIM API for  */
  dimApiEnabled: boolean;
  /** Don't allow refresh more often than this many seconds. */
  destinyProfileMinimumRefreshInterval: number;
  /** Time in seconds to refresh the profile when autoRefresh is true. */
  destinyProfileRefreshInterval: number;
  /** Whether to refresh profile automatically. */
  autoRefresh: boolean;
  /** Whether to refresh profile when the page becomes visible after being in the background. */
  refreshProfileOnVisible: boolean;
  /** Whether to use dirty tricks to bust the Bungie.net cache when users manually refresh. */
  bustProfileCacheOnHardRefresh: boolean;
}

export interface ProfileResponse {
  settings?: Settings;
  loadouts?: Loadout[];
  tags?: ItemAnnotation[];
}

/** The following are types from the DIM API */

/** Any extra info added by the user to individual items - tags, notes, etc. */
interface ItemAnnotation {
  /** The item instance ID for an individual item */
  id: string;
  /** Optional tag for the item. */
  tag?: TagValue | null;
  /** Optional text notes on the item. */
  notes?: string | null;
}

interface LoadoutItem {
  // itemInstanceId of the item (if it's instanced)
  id?: string;
  // DestinyInventoryItemDefinition hash of the item
  hash: number;
  // Optional amount (for consumables), default to zero
  amount?: number;
}

interface Loadout {
  // A globally unique (UUID) identifier for the loadout.
  // Chosen by the client
  id: string;
  name: string;
  // DestinyClass enum value for the class this loadout is restricted
  // to. This is optional (set to Unknown for loadouts that can be used anywhere).
  classType: DestinyClass;
  // DestinyInventoryItemDefinition hash of an emblem to use as
  // an icon for this loadout
  emblemHash?: number;
  // Whether to clear out other items when applying this loadout
  clearSpace: boolean;
  // Lists of equipped and unequipped items in the loadout
  equipped: LoadoutItem[];
  unequipped: LoadoutItem[];
}
