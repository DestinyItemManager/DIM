import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React, { memo, useCallback } from 'react';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import DraggableInventoryItem from '../inventory/DraggableInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import { DimItem } from '../inventory/item-types';
import { moveItemToCurrentStore } from '../inventory/move-item';

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default memo(function StoreInventoryItem({ item }: { item: DimItem }) {
  const dispatch = useThunkDispatch();
  const doubleClicked = useCallback(
    (e: React.MouseEvent) => dispatch(moveItemToCurrentStore(item, e)),
    [dispatch, item],
  );

  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            allowFilter={true}
            ref={ref}
            // intercept inventory item click and send it to the stream deck if needed
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
});
