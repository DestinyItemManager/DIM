import { DimItem } from 'app/inventory/item-types';
import { EventBus } from 'app/utils/observable';

export const showInfuse$ = new EventBus<DimItem>();

/**
 * Show the infusion fuel finder.
 */
export function showInfuse(item: DimItem) {
  showInfuse$.next(item);
}
