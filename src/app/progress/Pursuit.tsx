import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import ItemExpiration from 'app/item-popup/ItemExpiration';

export default function Pursuit({ item }: { item: DimItem }) {
  return (
    <div className="milestone-quest" key={item.index}>
      <div className="milestone-icon">
        <ItemPopupTrigger item={item}>
          <ConnectedInventoryItem item={item} allowFilter={true} />
        </ItemPopupTrigger>
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{item.name}</span>
        <div className="milestone-description">{item.description}</div>
        <ItemExpiration item={item} />
      </div>
    </div>
  );
}
