import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType, BurnItem } from '../types';
import './lockeditemcontainer.scss';
import { D2Item } from '../../inventory/item-types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { toggleLockedItem } from '../generated-sets/utils';

/**
 * Render the locked item bucket. Could contain an item, perk, burn
 */
export default function LockedItemContainer({
  locked,
  bucket,
  toggleOpen,
  onExclude,
  onLockChanged
}: {
  locked?: LockedItemType[];
  bucket: InventoryBucket;
  toggleOpen(): void;
  onExclude(excludedItem: LockedItemType): void;
  onLockChanged(bucket: InventoryBucket, locked?: LockedItemType[]): void;
}) {
  // one item locked
  if (locked && locked.length && locked[0].type === 'item') {
    return (
      <LoadoutBuilderItem item={locked[0].item as D2Item} locked={locked} onExclude={onExclude} />
    );
  }

  function renderLockedItem(lockedItem) {
    switch (lockedItem.type) {
      case 'exclude':
      case 'item':
        return (
          <LoadoutBuilderItem
            item={lockedItem.item as D2Item}
            locked={locked}
            onExclude={onExclude}
          />
        );

      case 'perk':
        const perkItem = lockedItem.item as DestinyInventoryItemDefinition;
        return (
          <BungieImage
            key={perkItem.index}
            className="empty-item"
            title={perkItem.displayProperties.name}
            src={perkItem.displayProperties.icon}
          />
        );

      case 'burn':
        const burnItem = lockedItem.item as BurnItem;
        return (
          <div
            key={burnItem.index}
            className={`empty-item ${burnItem.index}`}
            title={burnItem.displayProperties.name}
          />
        );
    }
  }

  return (
    <>
      <div className="empty-item" onClick={toggleOpen}>
        <div className="add-perk-container">
          <div className="add-perk-text">
            {t('LoadoutBuilder.LockBucket', { bucket: bucket.name })}
          </div>
        </div>
      </div>

      {locked &&
        locked.map((lockedItem) => {
          return (
            <div className="locked-item-box" key={lockedItem.item.index}>
              {renderLockedItem(lockedItem)}
              <div
                className="close"
                onClick={() => toggleLockedItem(lockedItem, bucket, onLockChanged, locked)}
              />
            </div>
          );
        })}
    </>
  );
}
