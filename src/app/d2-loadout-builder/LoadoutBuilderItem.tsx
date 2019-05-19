import classNames from 'classnames';
import React from 'react';
import { D2Item } from '../inventory/item-types';
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
  item: D2Item;
  locked?: readonly LockedItemType[];
  addLockedItem(lockedItem: LockedItemType): void;
}) {
  const handleShiftClick = (e) => {
    if (e.shiftKey) {
      e.stopPropagation();
      addLockedItem({ type: 'exclude', item, bucket: item.bucket });
    }
  };

  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        <div
          className={classNames({
            'excluded-item':
              locked && locked.some((p) => p.type === 'exclude' && p.item.index === item.index)
          })}
        >
          <ConnectedInventoryItem item={item} onClick={handleShiftClick} />
        </div>
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
