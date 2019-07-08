import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import ItemExpiration from 'app/item-popup/ItemExpiration';

/**
 * A Pursuit is an inventory item that represents a bounty or quest. This displays
 * a pursuit tile for the Progress page.
 */
export default function Pursuit({ item }: { item: DimItem }) {
  return (
    <div className="milestone-quest" key={item.index}>
      <div className="milestone-icon">
        <ItemPopupTrigger item={item}>
          <ConnectedInventoryItem item={item} allowFilter={true} />
        </ItemPopupTrigger>
      </div>
      <div className="milestone-info">
        <span className="milestone-name">
          <ItemExpiration item={item} compact={true} />
          {item.name}
        </span>
        <div className="milestone-description">{item.description}</div>
      </div>
    </div>
  );
}

/**
 * Should this item be displayed as expired (no longer completable)?
 */
export function showPursuitAsExpired(item: DimItem) {
  // Suppress description when expiration is shown
  const suppressExpiration =
    item.isDestiny2() &&
    item.quest &&
    item.quest.suppressExpirationWhenObjectivesComplete &&
    item.complete;

  const expired =
    !suppressExpiration && item.isDestiny2() && item.quest && item.quest.expirationDate
      ? item.quest.expirationDate.getTime() < Date.now()
      : false;

  return expired;
}
