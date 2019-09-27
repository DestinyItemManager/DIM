import React from 'react';
import { DimItem } from '../inventory/item-types';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';

export default function LoadoutDrawerItem({
  item,
  equip,
  remove
}: {
  item: DimItem;
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
}) {
  return (
    <div onClick={(e) => equip(item, e)} className="loadout-item">
      <ConnectedInventoryItem item={item} doNotRepresentSelectedPerks={true} />
      <div className="close" onClick={(e) => remove(item, e)} />
    </div>
  );
}
