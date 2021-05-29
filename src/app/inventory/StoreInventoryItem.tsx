import { Inspect } from 'app/mobile-inspect/MobileInspect';
import { searchFilterSelector } from 'app/search/search-filter';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import DraggableInventoryItem from './DraggableInventoryItem';
import { DimItem } from './item-types';
import ItemPopupTrigger from './ItemPopupTrigger';
import { moveItemToCurrentStore } from './move-item';

interface Props {
  item: DimItem;
  isPhonePortrait?: boolean;
}

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default function StoreInventoryItem({ item, isPhonePortrait }: Props) {
  const dispatch = useThunkDispatch();
  const currentFilter = useSelector(searchFilterSelector);
  const doubleClicked = (e: React.MouseEvent) => {
    dispatch(moveItemToCurrentStore(item, e));
  };

  return (
    <DraggableInventoryItem
      item={item}
      isPhonePortrait={isPhonePortrait}
      inspect={Inspect.showMoveLocations}
    >
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            allowFilter={true}
            innerRef={ref}
            onClick={onClick}
            onDoubleClick={doubleClicked}
            // for only StoreInventoryItems (the main inventory page)
            // we inject a special marker for use in dimming archived items
            searchFilterIsEmpty={currentFilter === _.stubTrue}
          />
        )}
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
