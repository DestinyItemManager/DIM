import * as React from 'react';
import classNames from 'classnames';
import { D2Item } from '../inventory/item-types';
import StoreInventoryItem from '../inventory/StoreInventoryItem';
import { LockType } from './LoadoutBuilder';

export default function ExcludableItem({ locked, item }: { locked?: LockType; item: D2Item }) {
  // const handleShiftClick = (event) => {
  //   if (event.shiftKey) {
  //     props.onLockChanged(this.props.bucket, {
  //       type: 'exclude',
  //       items: []
  //     });
  //     event.preventDefault();
  //   }
  // };

  return (
    <div
      className={classNames({
        selected: locked && locked.items && locked.items.find((p) => p.index === item.index)
      })}
      // onClick={handleShiftClick}
    >
      <StoreInventoryItem
        item={item}
        isNew={false}
        // tag={getTag(item, itemInfos)}
        // rating={dtrRating ? dtrRating.overallScore : undefined}
        // hideRating={!showRating}
        searchHidden={false}
      />
    </div>
  );
}
