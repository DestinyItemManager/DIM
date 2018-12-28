import { Subject } from 'rxjs/Subject';

import { DimItem } from '../inventory/item-types';

export const showItemPopup$ = new Subject<{
  item?: DimItem;
  element?: Element;
}>();

export function showItemPopup(item?: DimItem, element?: Element) {
  showItemPopup$.next({ item, element });
}

export function hideItemPopup() {
  showItemPopup$.next({ item: undefined, element: undefined });
}
