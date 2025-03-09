import React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import ConnectedInventoryItem from '../../inventory/ConnectedInventoryItem';
import DraggableInventoryItem from '../../inventory/DraggableInventoryItem';
import ItemPopupTrigger from '../../inventory/ItemPopupTrigger';
import { D1Item } from '../../inventory/item-types';
import styles from './LoadoutBuilderItem.m.scss';

interface Props {
  item: D1Item & { vendorIcon?: string };
  shiftClickCallback?: (item: D1Item) => void;
}

export default function LoadoutBuilderItem({ item, shiftClickCallback }: Props) {
  const onShiftClick =
    shiftClickCallback &&
    ((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      shiftClickCallback(item);
    });

  // no owner means this is a vendor item
  if (!item.owner) {
    return (
      <DraggableInventoryItem item={item}>
        <div className={styles.overlayContainer}>
          <div className={styles.vendorIconBackground}>
            <BungieImage src={item.vendorIcon!} />
          </div>
          <ConnectedInventoryItem item={item} onShiftClick={onShiftClick} />
        </div>
      </DraggableInventoryItem>
    );
  }

  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            ref={ref}
            onClick={onClick}
            onShiftClick={onShiftClick}
          />
        )}
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
