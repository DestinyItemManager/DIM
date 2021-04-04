import { addCompareItem } from 'app/compare/actions';
import { compareOpenSelector } from 'app/compare/selectors';
import { ThunkResult } from 'app/store/types';
import React, { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ItemPopupExtraInfo, showItemPopup } from '../item-popup/item-popup';
import { clearNewItem } from './actions';
import { DimItem } from './item-types';

interface Props {
  item: DimItem;
  extraData?: ItemPopupExtraInfo;
  children(ref: React.Ref<HTMLDivElement>, onClick: (e: React.MouseEvent) => void): React.ReactNode;
}

/**
 * This provides a ref and onclick function for a component that will show the move popup for the provided item.
 */
// TODO: replace with a useItemPopup hook!
export default function ItemPopupTrigger({ item, extraData, children }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const clicked = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(itemPopupTriggerClicked(item, ref, extraData));
    },
    [dispatch, extraData, item]
  );

  return children(ref, clicked) as JSX.Element;
}

function itemPopupTriggerClicked(
  item: DimItem,
  ref: React.RefObject<HTMLDivElement>,
  extraData?: ItemPopupExtraInfo
): ThunkResult {
  return async (dispatch, getState) => {
    dispatch(clearNewItem(item.id));

    if (compareOpenSelector(getState())) {
      dispatch(addCompareItem(item));
    } else if (ref.current) {
      showItemPopup(item, ref.current, extraData);
    }
  };
}
