import { DimItem } from 'app/inventory/item-types';
import { Subject } from 'rxjs';
import { Inspect } from './MobileInspect';

export interface MobileInspector {
  item?: DimItem;
  inspectType?: Inspect;
}

export const showMobileInspect$ = new Subject<MobileInspector>();

/**
 * Show the mobile quick move sheet
 */
export function showMobileInspect(item?: DimItem, inspectType?: Inspect) {
  showMobileInspect$.next({ item, inspectType });
}
