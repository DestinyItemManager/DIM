import React, { useRef, useCallback } from 'react';
import { DimItem } from './item-types';
import { CompareService } from '../compare/compare.service';
import { showItemPopup, ItemPopupExtraInfo } from '../item-popup/item-popup';
import { loadoutDialogOpen, addItemToLoadout } from 'app/loadout/LoadoutDrawer';
import { clearNewItem } from './actions';
import { useDispatch } from 'react-redux';

interface Props {
  item: DimItem;
  extraData?: ItemPopupExtraInfo;
  children(ref: React.Ref<HTMLDivElement>, onClick: (e: React.MouseEvent) => void): React.ReactNode;
}

/**
 * This wraps its children in a div which, when clicked, will show the move popup for the provided item.
 */
export default function ItemPopupTrigger({ item, extraData, children }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const clicked = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      dispatch(clearNewItem(item.id));

      // TODO: a dispatcher based on store state?
      if (loadoutDialogOpen) {
        addItemToLoadout(item, e);
      } else if (CompareService.dialogOpen) {
        CompareService.addItemsToCompare([item]);
      } else {
        showItemPopup(item, ref.current!, extraData);
        return false;
      }
    },
    [dispatch, extraData, item]
  );

  return children(ref, clicked) as JSX.Element;
}
