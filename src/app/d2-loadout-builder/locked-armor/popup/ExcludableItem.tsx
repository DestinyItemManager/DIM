import classNames from 'classnames';
import * as React from 'react';
import { D2Item } from '../../../inventory/item-types';
import StoreInventoryItem from '../../../inventory/StoreInventoryItem';
import { LockedItemType } from '../../types';

export default function ExcludableItem({
  locked,
  item,
  onExclude
}: {
  locked?: LockedItemType[];
  item: D2Item;
  onExclude(item: LockedItemType): void;
}) {
  const handleShiftClick = (item) => {
    onExclude({ type: 'exclude', item });
  };

  return (
    <div
      className={classNames({
        'excluded-item': locked && locked.find((p) => p.item.index === item.index)
      })}
    >
      <StoreInventoryItem
        item={item}
        onShiftClicked={handleShiftClick}
        isNew={false}
        searchHidden={false}
      />
    </div>
  );
}
