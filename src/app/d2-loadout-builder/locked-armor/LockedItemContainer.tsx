import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { D2Item } from '../../inventory/item-types';
import { toggleLockedItem } from '../generated-sets/utils';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { BurnItem, LockedItemType } from '../types';
import './lockeditemcontainer.scss';

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
  // one item locked (replaces the select box)
  if (locked && locked.length && locked[0].type === 'item') {
    return (
      <div className="locked-item-box">
        <LoadoutBuilderItem item={locked[0].item as D2Item} locked={locked} onExclude={onExclude} />
        <div
          className="close"
          onClick={() => toggleLockedItem(locked[0], bucket, onLockChanged, locked)}
        />
      </div>
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
          <img
            key={burnItem.index}
            className={`empty-item ${burnItem.index}`}
            title={burnItem.displayProperties.name}
            src={burnItem.displayProperties.icon}
          />
        );
    }
  }

  return (
    <>
      <div className="empty-item" onClick={toggleOpen}>
        <div className="add-perk-container">
          <div className="add-perk-text">{bucket.name}</div>
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
