import { DimItem } from 'app/inventory/item-types';
import { EventBus } from 'app/utils/observable';
import { Loadout } from '../loadout/loadout-types';

export interface EditLoadoutState {
  loadout: Loadout;
  showClass: boolean;
  storeId: string;
  fromExternal: boolean;
}

export const editLoadout$ = new EventBus<EditLoadoutState>();
export const addItem$ = new EventBus<DimItem>();

/**
 * Start editing a loadout.
 */
export function editLoadout(
  loadout: Loadout,
  storeId: string,
  {
    showClass = true,
    /** Is this from an external source (e.g. a loadout share)? */
    fromExternal = false,
  }: { showClass?: boolean; fromExternal?: boolean } = {},
) {
  editLoadout$.next({
    storeId,
    loadout,
    showClass,
    fromExternal,
  });
}

/**
 * Add an item to the loadout we're currently editing. This is driven by clicks in Inventory.
 */
export function addItemToLoadout(item: DimItem) {
  addItem$.next(item);
}

/**
 * Copy and Edit Loadout
 */
export function copyAndEditLoadout(
  loadout: Loadout,
  storeId: string,
  { showClass = true }: { showClass?: boolean } = {},
) {
  const copiedLoadout = {
    ...loadout,
    name: `${loadout.name} - Copy`,
    id: globalThis.crypto.randomUUID(), // Give it a new ID so it's a new loadout
  };
  editLoadout(copiedLoadout, storeId, { showClass });
}
