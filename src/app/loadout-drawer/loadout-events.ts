import { DimItem } from 'app/inventory/item-types';
import { EventBus } from 'app/utils/observable';
import { Loadout } from './loadout-types';

export interface EditLoadoutState {
  loadout: Loadout;
  showClass: boolean;
  isNew: boolean;
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
    isNew = true,
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
