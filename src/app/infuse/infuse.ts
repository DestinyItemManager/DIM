import { DimItem } from '../inventory/item-types';
import { Subject } from 'rxjs';

export interface InfuseOptions {
  item: DimItem;
}

export const showInfuse$ = new Subject<InfuseOptions>();

/**
 * Show the infusion fuel finder.
 */
export function showInfuse(item: DimItem) {
  showInfuse$.next({ item });
}
