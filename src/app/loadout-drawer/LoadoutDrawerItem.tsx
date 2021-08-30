import ClassIcon from 'app/dim-ui/ClassIcon';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import React from 'react';
import { DimItem } from '../inventory/item-types';

export default function LoadoutDrawerItem({
  item,
  equip,
  remove,
}: {
  item: DimItem;
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
}) {
  const onClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    remove(item, e);
  };

  return (
    <div onClick={(e) => equip(item, e)} className="loadout-item">
      <ClosableContainer onClose={onClose}>
        <ConnectedInventoryItem item={item} ignoreSelectedPerks={true} />
        {item.type === 'Class' && (
          <ClassIcon classType={item.classType} className="loadout-item-class-icon" />
        )}
      </ClosableContainer>
    </div>
  );
}
