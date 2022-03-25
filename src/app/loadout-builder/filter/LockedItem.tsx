import ClosableContainer from 'app/dim-ui/ClosableContainer';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
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
            <ConnectedInventoryItem
              item={lockedItem}
              onClick={onClick}
              innerRef={ref}
              ignoreSelectedMods={true}
            />
          )}
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    </ClosableContainer>
  );
}
