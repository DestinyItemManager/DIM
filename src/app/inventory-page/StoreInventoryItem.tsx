import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React from 'react';
import { moveItemToCurrentStore } from '../inventory-actions/move-item';
import ConnectedInventoryItem from '../inventory-item/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory-item/ItemPopupTrigger';
import { DimItem } from '../inventory-stores/item-types';
import DraggableInventoryItem from './DraggableInventoryItem';

interface Props {
  item: DimItem;
}

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default function StoreInventoryItem({ item }: Props) {
  const dispatch = useThunkDispatch();
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
