import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { isInventoryItemDefinition, isD2Item } from '../generated-sets/utils';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType } from '../types';
import './lockeditem.scss';

/**
 * Render the locked item bucket. Could contain an item, perk, or a string if
 * multiple things are selected.
 */
export default function LockedItem({
  locked,
  bucket,
  toggleOpen,
  onExclude
}: {
  locked?: LockedItemType[];
  bucket: InventoryBucket;
  toggleOpen(): void;
  onExclude(excludedItem: LockedItemType): void;
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
  if (locked.length > 1 || locked[0].type === 'exclude') {
    const perks = locked.filter((item) => item.type === 'perk');
    const excluded = locked.filter((item) => item.type === 'exclude');

    return (
      <div className="empty-item" onClick={toggleOpen}>
        <div
          className={classNames('add-perk-container', {
            'has-locked': locked.length
          })}
        >
          <div className="add-perk-text">
            {perks.length !== 0 && (
              <div>{t('LoadoutBuilder.LockedPerks', { locked: perks.length })}</div>
            )}
            {excluded.length !== 0 && (
              <div>{t('LoadoutBuilder.ExcludedItems', { locked: excluded.length })}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const lockedItem = locked[0];

  // one item locked/excluded
  if (lockedItem.type === 'item' && isD2Item(lockedItem.item)) {
    return <LoadoutBuilderItem item={lockedItem.item} locked={locked} onExclude={onExclude} />;
  }

  // one perk locked
  if (lockedItem.type === 'perk' && isInventoryItemDefinition(lockedItem.item)) {
    return (
      <div onClick={toggleOpen}>
        <BungieImage
          key={lockedItem.item.hash}
          className="empty-item"
          title={lockedItem.item.displayProperties.name}
          src={lockedItem.item.displayProperties.icon}
        />
      </div>
    );
  }

  return null;
}
