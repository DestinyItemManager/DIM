import { Subject } from 'rxjs';
import { DimItem } from '../inventory/item-types';

export const showItemPopup$ = new Subject<{
  item?: DimItem;
  element?: HTMLElement;
  extraInfo?: ItemPopupExtraInfo;
}>();

// Extra optional info for Vendors/Collectibles.
export interface ItemPopupExtraInfo {
  failureStrings?: string[];
  owned?: boolean;
  acquired?: boolean;
  mod?: boolean;
}

export function showItemPopup(
  item: DimItem,
  element?: HTMLElement,
  extraInfo?: ItemPopupExtraInfo
) {
  showItemPopup$.next({ item, element, extraInfo });
}

export function hideItemPopup() {
  showItemPopup$.next({});
}
