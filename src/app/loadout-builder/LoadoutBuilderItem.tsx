import React from 'react';
import ConnectedInventoryItem from '../inventory-item/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory-item/ItemPopupTrigger';
import DraggableInventoryItem from '../inventory-page/DraggableInventoryItem';
import { DimItem } from '../inventory-stores/item-types';

/**
 * A draggable item from an armor set. Shift-clicking will exclude the item.
 */
export default function LoadoutBuilderItem({
  item,
  onShiftClick,
}: {
  item: DimItem;
  onShiftClick(): void;
}) {
  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            onClick={onClick}
            onShiftClick={onShiftClick}
            innerRef={ref}
          />
        )}
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
