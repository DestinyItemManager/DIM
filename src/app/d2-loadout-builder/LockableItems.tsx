import * as React from 'react';
import { D2Item } from '../inventory/item-types';

import { LockType } from './LoadoutBuilder';
import ExcludableItem from './ExcludableItem';

export default function LockableItems({
  items,
  locked
}: {
  items: {
    [itemHash: number]: D2Item[];
  };
  locked?: LockType;
}) {
  // const onExclude = (item) => {
  //   onLockChanged(this.props.bucket, {
  //     type: 'exclude',
  //     items: [item]
  //   });
  // };

  return (
    <>
      <div>Drag item to lock (Shift-click to exclude)</div>
      <div className="add-perk-options-content">
        {Object.values(items).map((instances: D2Item[]) =>
          instances.map((item) => <ExcludableItem key={item.id} {...{ item, locked }} />)
        )}
      </div>
    </>
  );
}
