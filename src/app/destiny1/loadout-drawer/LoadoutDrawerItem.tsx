import ClassIcon from 'app/dim-ui/ClassIcon';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';

export default function LoadoutDrawerItem({
  resolvedLoadoutItem,
  equip,
  remove,
}: {
  resolvedLoadoutItem: ResolvedLoadoutItem;
  equip(resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent): void;
  remove(resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent): void;
}) {
  const onClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    remove(resolvedLoadoutItem, e);
  };

  const { item } = resolvedLoadoutItem;

  return (
    <div onClick={(e) => equip(resolvedLoadoutItem, e)} className="loadout-item">
      <ClosableContainer onClose={onClose} showCloseIconOnHover={true}>
        <ConnectedInventoryItem item={item} />
        {item.bucket.hash === BucketHashes.Subclass && (
          <ClassIcon classType={item.classType} className="loadout-item-class-icon" />
        )}
      </ClosableContainer>
    </div>
  );
}
