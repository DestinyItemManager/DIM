import classNames from 'classnames';
import React from 'react';
import { D2Item } from '../inventory/item-types';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { LockedItemType } from './types';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import DraggableInventoryItem from '../inventory/DraggableInventoryItem';

export default function LoadoutBuilderItem({
  item,
  locked,
  onExclude
}: {
  item: D2Item;
  locked?: readonly LockedItemType[];
  onExclude(item: LockedItemType): void;
}) {
  const handleShiftClick = (e) => {
    if (e.shiftKey) {
      e.stopPropagation();
      onExclude({ type: 'exclude', item });
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
