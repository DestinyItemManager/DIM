import React from 'react';
import { DimItem } from './item-types';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import { AppIcon } from 'app/shell/icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { DimStore } from './store-types';
import styles from './MoveNotifications.m.scss';

/**
 * Generate JSX for a move item notification. This isn't a component.
 */
export function moveItemNotification(item: DimItem, target: DimStore) {
  return (
    <div className={styles.moveNotification}>
      <ConnectedInventoryItem item={item} />
      <AppIcon icon={faArrowRight} />
      <img className={styles.storeIcon} src={target.icon} />
    </div>
  );
}
