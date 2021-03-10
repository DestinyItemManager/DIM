import { EventBus } from 'app/utils/observable';
import { DimItem } from '../inventory/item-types';

export const showInfuse$ = new EventBus<DimItem>();

/**
 * Show the infusion fuel finder.
 */
export function showInfuse(item: DimItem) {
  showInfuse$.next(item);
}
