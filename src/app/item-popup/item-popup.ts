import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { infoLog } from 'app/utils/log';
import { Observable } from 'app/utils/observable';
import { DimItem } from '../inventory/item-types';

export const showItemPopup$ = new Observable<
  | {
      item?: DimItem;
      element?: HTMLElement;
      extraInfo?: ItemPopupExtraInfo;
    }
  | undefined
>(undefined);

// Extra optional info for Vendors/Collectibles.
export interface ItemPopupExtraInfo {
  failureStrings?: string[];
  characterId?: string;
  owned?: boolean;
  acquired?: boolean;
  mod?: boolean;
  socketOverrides?: SocketOverrides;
  // whether you can make this item at all
  canCraftThis?: boolean;
  // if you completely leveled up the item, it can be crafted with any of its perks. impressive.
  canCraftAllPlugs?: boolean;
}

export function showItemPopup(
  item: DimItem,
  element?: HTMLElement,
  extraInfo?: ItemPopupExtraInfo,
) {
  if (showItemPopup$.getCurrentValue()?.item === item) {
    hideItemPopup();
  } else {
    // Log the item so it's easy to inspect item structure by clicking on an item
    if ($DIM_FLAVOR !== 'release') {
      infoLog('clicked item', item);
    }
    showItemPopup$.next({ item, element, extraInfo });
  }
}

export function hideItemPopup() {
  showItemPopup$.next(undefined);
}
