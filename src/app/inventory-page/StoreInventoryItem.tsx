import { DimItem } from 'app/inventory/item-types';
import { moveItemToCurrentStore } from 'app/inventory/move-item';
import ConnectedInventoryItem from 'app/item/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/item/DraggableInventoryItem';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React, { useCallback } from 'react';
import ItemPopupTrigger from '../item-popup/ItemPopupTrigger';

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
