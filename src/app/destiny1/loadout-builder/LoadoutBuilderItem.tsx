import React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import ConnectedInventoryItem from '../../inventory-item/ConnectedInventoryItem';
import ItemPopupTrigger from '../../inventory-item/ItemPopupTrigger';
import DraggableInventoryItem from '../../inventory-page/DraggableInventoryItem';
import { D1Item } from '../../inventory-stores/item-types';

interface Props {
  item: D1Item & { vendorIcon?: string };
  shiftClickCallback?(item: D1Item): void;
}

export default function LoadoutBuilderItem({ item, shiftClickCallback }: Props) {
  const onShiftClick =
    shiftClickCallback &&
    ((e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      shiftClickCallback(item);
    });

  // no owner means this is a vendor item
  if (!item.owner) {
    return (
      <div className="loadout-builder-item">
        <DraggableInventoryItem item={item}>
          <div className="item-overlay-container">
            <div className="vendor-icon-background">
              <BungieImage src={item.vendorIcon!} className="vendor-icon" />
            </div>
            <ConnectedInventoryItem item={item} onShiftClick={onShiftClick} />
          </div>
        </DraggableInventoryItem>
      </div>
    );
  }

  return (
    <div className="loadout-builder-item">
      <DraggableInventoryItem item={item}>
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <ConnectedInventoryItem
              item={item}
              innerRef={ref}
              onClick={onClick}
              onShiftClick={onShiftClick}
            />
          )}
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    </div>
  );
}
