import { DimItem } from '../inventory/item-types';
import { Subject } from 'rxjs';

export const showItemPopup$ = new Subject<{
  item?: DimItem;
  element?: Element;
  extraInfo?: ItemPopupExtraInfo;
}>();

// Extra optional info for Vendors/Collectibles.
export interface ItemPopupExtraInfo {
  failureStrings?: string[];
  owned?: boolean;
  acquired?: boolean;
  mod?: boolean;
}

export function showItemPopup(item: DimItem, element?: Element, extraInfo?: ItemPopupExtraInfo) {
  showItemPopup$.next({ item, element, extraInfo });
}

export function hideItemPopup() {
  showItemPopup$.next({});
}
