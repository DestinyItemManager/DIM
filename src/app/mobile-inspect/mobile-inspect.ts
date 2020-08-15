import { Subject } from 'rxjs';
import { DimItem } from 'app/inventory/item-types';

export interface MobileInspector {
  item?: DimItem;
}

export const showMobileInspect$ = new Subject<MobileInspector>();

/**
 * Show the mobile quick move sheet
 */
export function showMobileInspect(item?: DimItem) {
  showMobileInspect$.next({ item });
}
