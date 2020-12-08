import { settingsSelector } from 'app/dim-api/selectors';
import React, { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CompareService } from '../compare/compare.service';
import { ItemPopupExtraInfo, showItemPopup } from '../item-popup/item-popup';
import { clearNewItem } from './actions';
import { DimItem } from './item-types';

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
  const disableConfetti = useSelector(settingsSelector).disableConfetti;
  const dispatch = useDispatch();

  const clicked = useCallback(
    (e: React.MouseEvent) => {
      if (disableConfetti) {
        e.stopPropagation();
      }

      dispatch(clearNewItem(item.id));

      // TODO: a dispatcher based on store state?
      if (CompareService.dialogOpen) {
        CompareService.addItemsToCompare([item]);
      } else {
        showItemPopup(item, ref.current!, extraData);
        return false;
      }
    },
    [dispatch, extraData, item, disableConfetti]
  );

  return children(ref, clicked) as JSX.Element;
}
