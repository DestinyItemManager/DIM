import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/item-popup/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/item/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/item/DraggableInventoryItem';
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
