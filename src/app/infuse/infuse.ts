import { Subject } from 'rxjs/Subject';
import { DimItem } from '../inventory/item-types';

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
