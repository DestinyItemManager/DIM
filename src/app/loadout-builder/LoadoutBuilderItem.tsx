import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/item-popup/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/item/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/item/DraggableInventoryItem';
import React from 'react';

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
