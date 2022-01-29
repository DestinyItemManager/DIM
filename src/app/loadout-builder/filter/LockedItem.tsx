import ClosableContainer from 'app/dim-ui/ClosableContainer';
import ConnectedInventoryItem from 'app/inventory-item/ConnectedInventoryItem';
import ItemPopupTrigger from 'app/inventory-item/ItemPopupTrigger';
import DraggableInventoryItem from 'app/inventory-page/DraggableInventoryItem';
import { DimItem } from 'app/inventory-stores/item-types';
import React from 'react';

/**
 * Render a pinned or excluded item.
 */
export default function LockedItem({
  lockedItem,
  onRemove,
}: {
  lockedItem: DimItem;
  onRemove?(item: DimItem): void;
}) {
  return (
    <ClosableContainer
      onClose={onRemove ? () => onRemove(lockedItem) : undefined}
      key={lockedItem.id}
    >
      <DraggableInventoryItem item={lockedItem}>
        <ItemPopupTrigger item={lockedItem}>
          {(ref, onClick) => (
            <ConnectedInventoryItem item={lockedItem} onClick={onClick} innerRef={ref} />
          )}
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    </ClosableContainer>
  );
}
