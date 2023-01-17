import { addCompareItem } from 'app/compare/actions';
import { compareOpenSelector } from 'app/compare/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { ThunkResult } from 'app/store/types';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  hideItemPopup,
  ItemPopupExtraInfo,
  showItemPopup,
  showItemPopup$,
} from '../item-popup/item-popup';
import { clearNewItem } from './actions';
import { DimItem } from './item-types';

interface Props {
  item: DimItem;
  extraData?: ItemPopupExtraInfo;
  /** Don't allow adding to compare */
  noCompare?: boolean;
  children: (
    ref: React.Ref<HTMLDivElement>,
    onClick: (e: React.MouseEvent) => void
  ) => React.ReactNode;
}

/**
 * This provides a ref and onclick function for a component that will show the move popup for the provided item.
 */
export default function ItemPopupTrigger({
  item,
  extraData,
  children,
  noCompare,
}: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useThunkDispatch();

  const clicked = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(itemPopupTriggerClicked(item, ref, extraData, noCompare));
    },
    [dispatch, extraData, item, noCompare]
  );

  // Close the popup if this component is unmounted
  useEffect(
    () => () => {
      if (showItemPopup$.getCurrentValue()?.item === item) {
        hideItemPopup();
      }
    },
    // We really only want to do this on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return children(ref, clicked) as JSX.Element;
}

function itemPopupTriggerClicked(
  item: DimItem,
  ref: React.RefObject<HTMLDivElement>,
  extraData?: ItemPopupExtraInfo,
  noCompare?: boolean
): ThunkResult {
  return async (dispatch, getState) => {
    dispatch(clearNewItem(item.id));

    if (!noCompare && compareOpenSelector(getState())) {
      dispatch(addCompareItem(item));
    } else if (ref.current) {
      showItemPopup(item, ref.current, extraData);
    }
  };
}
