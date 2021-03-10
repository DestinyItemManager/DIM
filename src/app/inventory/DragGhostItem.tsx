import InventoryItem from 'app/inventory/InventoryItem';
import React from 'react';
import { useSubscription } from 'use-subscription';
import { showDragGhost$ } from './drag-ghost-item';
import styles from './DragGhostItem.m.scss';

/**
 * This is used to show a dragged item for touch events
 */
export default function DragGhostItem() {
  const state = useSubscription(showDragGhost$);

  if (!state?.item) {
    return null;
  }

  return (
    <div className={styles.ghostImg} style={{ transform: state.transform }}>
      <InventoryItem item={state.item} />
    </div>
  );
}
