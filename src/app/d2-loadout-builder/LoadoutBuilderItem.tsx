import classNames from 'classnames';
import * as React from 'react';
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
  locked?: LockedItemType[];
  onExclude(item: LockedItemType): void;
}) {
  const handleShiftClick = (e) => {
    e.stopPropagation();
    onExclude({ type: 'exclude', item });
  };

  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        <div
          className={classNames({
            'excluded-item': locked && locked.some((p) => p.item.index === item.index)
          })}
        >
          <ConnectedInventoryItem item={item} onShiftClicked={handleShiftClick} />
        </div>
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
