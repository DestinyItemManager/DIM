import classNames from 'classnames';
import * as React from 'react';
import { D2Item } from '../../../inventory/item-types';
import StoreInventoryItem from '../../../inventory/StoreInventoryItem';
import { LockType } from '../../types';

export default function ExcludableItem({
  locked,
  item,
  onExclude
}: {
  locked?: LockType;
  item: D2Item;
  onExclude(item: D2Item): void;
}) {
  const handleShiftClick = (event) => {
    if (event.shiftKey) {
      event.preventDefault();
      onExclude(item);
    }
  };

  return (
    <div
      className={classNames({
        'excluded-item': locked && locked.items && locked.items.find((p) => p.index === item.index)
      })}
      onClick={handleShiftClick}
    >
      <StoreInventoryItem item={item} isNew={false} searchHidden={false} />
    </div>
  );
}
