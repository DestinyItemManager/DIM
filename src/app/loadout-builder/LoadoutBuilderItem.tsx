import clsx from 'clsx';
import React from 'react';
import { DimItem } from '../inventory/item-types';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { LockedItemType } from './types';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import DraggableInventoryItem from '../inventory/DraggableInventoryItem';

/**
 * A draggable item from an armor set. Shift-clicking will exclude the item.
 */
export default function LoadoutBuilderItem({
  item,
  locked,
  addLockedItem
}: {
  item: DimItem;
  locked?: readonly LockedItemType[];
  addLockedItem(lockedItem: LockedItemType): void;
}) {
  const handleShiftClick = (e) => {
    e.stopPropagation();
    addLockedItem({ type: 'exclude', item, bucket: item.bucket });
  };

  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <div
            className={clsx({
              'excluded-item':
                locked && locked.some((p) => p.type === 'exclude' && p.item.index === item.index)
            })}
          >
            <ConnectedInventoryItem
              item={item}
              onClick={onClick}
              onShiftClick={handleShiftClick}
              innerRef={ref}
            />
          </div>
        )}
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
