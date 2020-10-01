import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import React from 'react';
import ArmorBucketIcon from '../ArmorBucketIcon';
import ClosableContainer from '../ClosableContainer';
import { LockedItemType } from '../types';
import styles from './LockedItem.m.scss';

export default function LockedItem({
  lockedItem,
  onRemove,
}: {
  lockedItem: LockedItemType;
  onRemove(item: LockedItemType): void;
}) {
  switch (lockedItem.type) {
    case 'item':
    case 'exclude':
      return (
        <ClosableContainer onClose={() => onRemove(lockedItem)} key={lockedItem.item.id}>
          <DraggableInventoryItem item={lockedItem.item}>
            <ItemPopupTrigger item={lockedItem.item}>
              {(ref, onClick) => (
                <ConnectedInventoryItem item={lockedItem.item} onClick={onClick} innerRef={ref} />
              )}
            </ItemPopupTrigger>
          </DraggableInventoryItem>
        </ClosableContainer>
      );
    case 'perk':
      return (
        <ClosableContainer onClose={() => onRemove(lockedItem)} key={lockedItem.perk.hash}>
          <div className={styles.emptyItem}>
            <BungieImageAndAmmo
              hash={lockedItem.perk.hash}
              title={lockedItem.perk.displayProperties.name}
              src={lockedItem.perk.displayProperties.icon}
            />
            <ArmorBucketIcon bucket={lockedItem.bucket} className={styles.armorIcon} />
          </div>
        </ClosableContainer>
      );
  }
}
