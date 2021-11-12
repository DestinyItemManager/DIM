import { DimItem } from 'app/inventory/item-types';
import { EventBus } from 'app/utils/observable';
import { Loadout } from './loadout-types';

export const editLoadout$ = new EventBus<{
  loadout: Loadout;
  showClass?: boolean;
  isNew?: boolean;
}>();
export const addItem$ = new EventBus<{
  item: DimItem;
  clickEvent: MouseEvent | React.MouseEvent;
}>();

/**
 * Start editing a loadout.
 */
export function editLoadout(loadout: Loadout, { showClass = true, isNew = true } = {}) {
  editLoadout$.next({
    loadout,
    showClass,
    isNew,
  });
}

/**
 * Add an item to the loadout we're currently editing. This is driven by clicks in Inventory.
 */
export function addItemToLoadout(item: DimItem, $event: MouseEvent | React.MouseEvent) {
  addItem$.next({
    item,
    clickEvent: $event,
  });
}
