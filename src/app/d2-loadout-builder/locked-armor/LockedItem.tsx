import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import InventoryItem from '../../inventory/InventoryItem';
import ItemPopupTrigger from '../../inventory/ItemPopupTrigger';
import { LockType } from '../types';
import './lockeditem.scss';

/**
 * Render the locked item bucket. Could contain an item, perk, or a string if
 * multiple things are selected.
 */
export default function LockedItem({
  locked,
  bucket,
  toggleOpen
}: {
  locked?: LockType;
  bucket: InventoryBucket;
  toggleOpen(): void;
}) {
  // Nothing locked
  if (!locked) {
    return (
      <div className="empty-item" onClick={toggleOpen}>
        <div className="add-perk-container">
          <div className="add-perk-text">
            {t('LoadoutBuilder.LockBucket', { bucket: bucket.name })}
          </div>
        </div>
      </div>
    );
  }

  // Multi-things locked
  if (locked.items.length > 1) {
    return (
      <div className="empty-item" onClick={toggleOpen}>
        <div
          className={classNames('add-perk-container', {
            'has-locked': locked.items.length
          })}
        >
          <div className="add-perk-text">
            {locked.items.length} {locked.type === 'exclude' ? 'excluded' : 'locked perks'}
          </div>
        </div>
      </div>
    );
  }

  const item = locked.items[0];

  // one item locked/excluded
  if (locked.type === 'exclude' || locked.type === 'item') {
    return (
      <ItemPopupTrigger item={item}>
        <InventoryItem item={item} />
      </ItemPopupTrigger>
    );
  }

  // one perk locked
  if (locked.type === 'perk') {
    return (
      <div onClick={toggleOpen}>
        <BungieImage
          key={item.hash}
          className="empty-item"
          title={(item as any).displayProperties.name}
          src={(item as any).displayProperties.icon}
        />
      </div>
    );
  }

  return null;
}
