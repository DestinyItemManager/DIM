import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import ClosableContainer from 'app/loadout/loadout-ui/ClosableContainer';
import React from 'react';
import { LockedItemType } from '../types';

export default function LockedItem({
  lockedItem,
  onRemove,
}: {
  lockedItem: LockedItemType;
  onRemove(item: LockedItemType): void;
}) {
  switch (lockedItem.type) {
    case 'item':
    case 'exclude':
      return (
        <ClosableContainer onClose={() => onRemove(lockedItem)} key={lockedItem.item.id}>
          <DraggableInventoryItem item={lockedItem.item}>
            <ItemPopupTrigger item={lockedItem.item}>
              {(ref, onClick) => (
                <ConnectedInventoryItem item={lockedItem.item} onClick={onClick} innerRef={ref} />
              )}
            </ItemPopupTrigger>
          </DraggableInventoryItem>
        </ClosableContainer>
      );
  }
}
