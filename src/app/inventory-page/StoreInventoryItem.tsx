import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React, { useCallback } from 'react';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import DraggableInventoryItem from '../inventory/DraggableInventoryItem';
import { DimItem } from '../inventory/item-types';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import { moveItemToCurrentStore } from '../inventory/move-item';

interface Props {
  item: DimItem;
}

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default function StoreInventoryItem({ item }: Props) {
  const dispatch = useThunkDispatch();
  const doubleClicked = useCallback(
    (e: React.MouseEvent) => dispatch(moveItemToCurrentStore(item, e)),
    [dispatch, item]
  );

  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            allowFilter={true}
            innerRef={ref}
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
