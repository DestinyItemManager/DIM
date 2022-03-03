import { DimItem } from 'app/inventory/item-types';
import { EventBus } from 'app/utils/observable';

export const locateItem$ = new EventBus<DimItem>();

/**
 * Bring an item into view and briefly highlight it. Used to pick out a particular instance of an item in the inventory view.
 */
export function locateItem(item: DimItem) {
  locateItem$.next(item);
}
