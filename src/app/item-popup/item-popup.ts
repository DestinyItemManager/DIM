import { DimItem } from '../inventory/item-types';
import { DestinyCollectibleDefinition } from 'bungie-api-ts/destiny2';
import { Subject } from 'rxjs';

export const showItemPopup$ = new Subject<{
  item?: DimItem;
  element?: Element;
  extraInfo?: ItemPopupExtraInfo;
}>();

// Extra optional info for Vendors/Collectibles.
export interface ItemPopupExtraInfo {
  collectible?: DestinyCollectibleDefinition;
  failureStrings?: string[];
  owned?: boolean;
  acquired?: boolean;
  compareItem?: DimItem;
}

export function showItemPopup(item: DimItem, element: Element, extraInfo?: ItemPopupExtraInfo) {
  showItemPopup$.next({ item, element, extraInfo });
}

export function hideItemPopup() {
  showItemPopup$.next({});
}
