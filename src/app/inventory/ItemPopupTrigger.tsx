import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { ThunkResult } from 'app/store/types';
import React, { JSX, useCallback, useEffect, useRef } from 'react';
import {
  ItemPopupExtraInfo,
  hideItemPopup,
  showItemPopup,
  showItemPopup$,
} from '../item-popup/item-popup';
import { clearNewItem } from './actions';
import { DimItem } from './item-types';

/**
 * This provides a ref and onclick function for a component that will show the move popup for the provided item.
 */
export default function ItemPopupTrigger({
  item,
  extraData,
  children,
}: {
  item: DimItem;
  extraData?: ItemPopupExtraInfo;
  children: (
    ref: React.Ref<HTMLDivElement>,
    onClick: (e: React.MouseEvent) => void,
  ) => React.ReactNode;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useThunkDispatch();

  const clicked = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(itemPopupTriggerClicked(item, ref, extraData));
    },
    [dispatch, extraData, item],
  );

  // Close the popup if this component is unmounted
  useEffect(
    () => () => {
      if (showItemPopup$.getCurrentValue()?.item?.index === item.index) {
        hideItemPopup();
      }
    },
    [item.index],
  );

  return children(ref, clicked) as JSX.Element;
}

function itemPopupTriggerClicked(
  item: DimItem,
  ref: React.RefObject<HTMLDivElement | null>,
  extraData?: ItemPopupExtraInfo,
): ThunkResult {
  return async (dispatch) => {
    dispatch(clearNewItem(item.id));

    if (ref.current) {
      showItemPopup(item, ref.current, extraData);
    }
  };
}
