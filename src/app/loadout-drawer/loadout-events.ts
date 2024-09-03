import { DimItem } from 'app/inventory/item-types';
import { EventBus } from 'app/utils/observable';
import { Loadout } from '../loadout/loadout-types';

export interface EditLoadoutState {
  loadout: Loadout;
  showClass: boolean;
  isNew: boolean;
  storeId: string;
  fromExternal: boolean;
}

export const editLoadout$ = new EventBus<EditLoadoutState>();
export const addItem$ = new EventBus<DimItem>();
export const copyAndEditLoadout$ = new EventBus<{
  loadout: Loadout;
  showClass?: boolean;
  storeId: string;
}>();

/**
 * Start editing a loadout.
 */
export function editLoadout(
  loadout: Loadout,
  storeId: string,
  {
    showClass = true,
    isNew = true,
    /** Is this from an external source (e.g. a loadout share)? */
    fromExternal = false,
  }: { showClass?: boolean; isNew?: boolean; fromExternal?: boolean } = {},
) {
  editLoadout$.next({
    storeId,
    loadout,
    showClass,
    isNew,
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
  const copiedLoadout = { ...loadout, name: `${loadout.name} - Copy` };
  editLoadout(copiedLoadout, storeId, { showClass, isNew: true });
}
