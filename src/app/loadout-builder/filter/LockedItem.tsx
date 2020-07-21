import React from 'react';
import { LockedItemType } from '../types';
import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import ClosableContainer from '../ClosableContainer';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import styles from './LockedItem.m.scss';
import ArmorBucketIcon from '../ArmorBucketIcon';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';

export default function LockedItem({
  lockedItem,
  defs,
  onRemove,
}: {
  lockedItem: LockedItemType;
  defs: D2ManifestDefinitions;
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
    case 'mod':
      return (
        <ClosableContainer onClose={() => onRemove(lockedItem)} key={lockedItem.mod.hash}>
          <div className={styles.emptyItem}>
            <SocketDetailsMod itemDef={lockedItem.mod} defs={defs} />
            {lockedItem.bucket && (
              <ArmorBucketIcon bucket={lockedItem.bucket} className={styles.armorIcon} />
            )}
          </div>
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
    case 'burn':
      return (
        <ClosableContainer onClose={() => onRemove(lockedItem)} key={lockedItem.burn.dmg}>
          <div className={styles.emptyItem}>
            <div>
              <img
                title={lockedItem.burn.displayProperties.name}
                src={lockedItem.burn.displayProperties.icon}
              />
            </div>
            <ArmorBucketIcon bucket={lockedItem.bucket} className={styles.armorIcon} />
          </div>
        </ClosableContainer>
      );
  }
}
