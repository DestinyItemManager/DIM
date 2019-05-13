import React from 'react';
import { LockedItemType, BurnItem } from './types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { D2Item } from 'app/inventory/item-types';
import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import ClosableContainer from './ClosableContainer';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import styles from './LockedItem.m.scss';

export default function LockedItem({
  lockedItem,
  onRemove
}: {
  lockedItem: LockedItemType;
  onRemove(item: LockedItemType): void;
}) {
  switch (lockedItem.type) {
    case 'item':
    case 'exclude':
      return (
        <ClosableContainer
          onClose={() => onRemove(lockedItem)}
          key={(lockedItem.item as D2Item).id}
        >
          <DraggableInventoryItem item={lockedItem.item as D2Item}>
            <ItemPopupTrigger item={lockedItem.item as D2Item}>
              <ConnectedInventoryItem item={lockedItem.item as D2Item} />
            </ItemPopupTrigger>
          </DraggableInventoryItem>
        </ClosableContainer>
      );
    case 'perk':
      return (
        <ClosableContainer
          onClose={() => onRemove(lockedItem)}
          key={(lockedItem.item as DestinyInventoryItemDefinition).index}
        >
          <BungieImageAndAmmo
            hash={(lockedItem.item as DestinyInventoryItemDefinition).hash}
            className={styles.emptyItem}
            title={(lockedItem.item as DestinyInventoryItemDefinition).displayProperties.name}
            src={(lockedItem.item as DestinyInventoryItemDefinition).displayProperties.icon}
          />
        </ClosableContainer>
      );
    case 'burn':
      return (
        <ClosableContainer
          onClose={() => onRemove(lockedItem)}
          key={(lockedItem.item as BurnItem).index}
        >
          <img
            key={(lockedItem.item as BurnItem).index}
            className={styles.emptyItem}
            title={(lockedItem.item as BurnItem).displayProperties.name}
            src={(lockedItem.item as BurnItem).displayProperties.icon}
          />
        </ClosableContainer>
      );
  }
}
