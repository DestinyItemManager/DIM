import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType, BurnItem } from '../types';
import './lockeditem.scss';
import { D2Item } from '../../inventory/item-types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';

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
  // one item locked
  if (locked && locked.length && locked[0].type === 'item') {
    return (
      <LoadoutBuilderItem item={locked[0].item as D2Item} locked={locked} onExclude={onExclude} />
    );
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
          switch (lockedItem.type) {
            case 'exclude':
            case 'item':
              return (
                <LoadoutBuilderItem
                  key={lockedItem.item.index}
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
        })}
    </>
  );

  // // Multi-things locked
  // if (locked.length > 1 || locked[0].type === 'exclude') {
  //   const perks = locked.filter((item) => item.type === 'perk' || item.type === 'burn');
  //   const excluded = locked.filter((item) => item.type === 'exclude');

  //   return (
  //     <div className="empty-item" onClick={toggleOpen}>
  //       <div
  //         className={classNames('add-perk-container', {
  //           'has-locked': locked.length
  //         })}
  //       >
  //         <div className="add-perk-text">
  //           {perks.length !== 0 && (
  //             <div>{t('LoadoutBuilder.LockedPerks', { locked: perks.length })}</div>
  //           )}
  //           {excluded.length !== 0 && (
  //             <div>{t('LoadoutBuilder.ExcludedItems', { locked: excluded.length })}</div>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // const lockedItem = locked[0];

  // // one item locked/excluded
  // if (lockedItem.type === 'item' && isD2Item(lockedItem.item)) {
  //   return <LoadoutBuilderItem item={lockedItem.item} locked={locked} onExclude={onExclude} />;
  // }

  // // one perk locked
  // if (lockedItem.type === 'perk' && isInventoryItemDefinition(lockedItem.item)) {
  //   return (
  //     <BungieImage
  //       className="empty-item"
  //       title={lockedItem.item.displayProperties.name}
  //       src={lockedItem.item.displayProperties.icon}
  //       onClick={toggleOpen}
  //     />
  //   );
  // }

  // // one burn perk locked
  // if (lockedItem.type === 'burn' && isBurnItem(lockedItem.item)) {
  //   return (
  //     <div
  //       onClick={toggleOpen}
  //       className={`empty-item ${lockedItem.item.index}`}
  //       title={lockedItem.item.displayProperties.name}
  //     />
  //   );
  // }

  // return null;
}
