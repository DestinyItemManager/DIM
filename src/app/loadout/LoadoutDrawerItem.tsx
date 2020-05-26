import React from 'react';
import { DimItem } from '../inventory/item-types';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import AppIcon from 'app/shell/icons/AppIcon';
import { classIcons } from 'app/inventory/StoreBucket';

export default function LoadoutDrawerItem({
  item,
  equip,
  remove,
}: {
  item: DimItem;
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
}) {
  const onClose = (e) => {
    e.stopPropagation();
    remove(item, e);
  };

  return (
    <div onClick={(e) => equip(item, e)} className="loadout-item">
      <ConnectedInventoryItem item={item} ignoreSelectedPerks={true} />
      <div className="close" onClick={onClose} />
      {item.type === 'Class' && (
        <AppIcon icon={classIcons[item.classType]} className="loadout-item-class-icon" />
      )}
    </div>
  );
}
