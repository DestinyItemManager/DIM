import { compareOpenSelector } from 'app/compare/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React from 'react';
import { useSelector } from 'react-redux';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import DraggableInventoryItem from './DraggableInventoryItem';
import { DimItem } from './item-types';
import ItemPopupTrigger from './ItemPopupTrigger';
import { moveItemToCurrentStore } from './move-item';

interface Props {
  item: DimItem;
}

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default function StoreInventoryItem({ item }: Props) {
  const dispatch = useThunkDispatch();
  const compareOpen = useSelector(compareOpenSelector);
  const doubleClicked = (e: React.MouseEvent) => {
    dispatch(moveItemToCurrentStore(item, e));
  };

  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            allowFilter={true}
            innerRef={ref}
            includeTooltip={compareOpen}
            onClick={onClick}
            onDoubleClick={doubleClicked}
            // for only StoreInventoryItems (the main inventory page)
            // we mark these to be dimmed if archived
            dimArchived
          />
        )}
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
