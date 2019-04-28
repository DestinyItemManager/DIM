import React from 'react';
import { D2Item } from '../../inventory/item-types';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType } from '../types';
import ItemSockets from '../../item-popup/ItemSockets';

export default function GeneratedSetItem({
  item,
  locked,
  onExclude
}: {
  item: D2Item;
  locked: LockedItemType[];
  onExclude(item: LockedItemType): void;
}) {
  // TODO: pass in locked items to itemsockets
  return (
    <div className="generated-build-items">
      <LoadoutBuilderItem item={item} locked={locked} onExclude={onExclude} />
      <ItemSockets item={item} hideMods={true} />
    </div>
  );
}
