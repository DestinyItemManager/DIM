import 'app/inventory-page/StoreBucket.scss';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { partition } from 'es-toolkit';
import React from 'react';
import { AddButton } from './Buttons';
import styles from './LoadoutDrawerBucket.m.scss';
import LoadoutDrawerItem from './LoadoutDrawerItem';

export default function LoadoutDrawerBucket({
  bucket,
  items,
  pickLoadoutItem,
  equip,
  remove,
}: {
  bucket: InventoryBucket;
  items: ResolvedLoadoutItem[];
  pickLoadoutItem: (bucket: InventoryBucket) => void;
  equip: (resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent) => void;
  remove: (resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent) => void;
}) {
  // This is never called with an empty items array
  if (!items.length) {
    return null;
  }

  const [equippedItems, unequippedItems] = partition(items, (li) => li.loadoutItem.equip);

  // Only allow one emblem
  const capacity = bucket.hash === BucketHashes.Emblems ? 1 : bucket.capacity;

  const mapItem = (li: ResolvedLoadoutItem) => (
    <LoadoutDrawerItem key={li.item.index} resolvedLoadoutItem={li} equip={equip} remove={remove} />
  );

  return (
    <div className={styles.loadoutBucket}>
      <div className={styles.loadoutBucketName}>{bucket.name}</div>
      <div className={styles.items}>
        <div className={clsx(styles.equipped, styles.itemGrid)}>
          <div className="equipped-item">
            {equippedItems.length > 0 ? (
              equippedItems.map(mapItem)
            ) : (
              <AddButton
                className={styles.equippedAddButton}
                onClick={() => pickLoadoutItem(bucket)}
              />
            )}
          </div>
        </div>
        {(equippedItems.length > 0 || unequippedItems.length > 0) &&
          bucket.hash !== BucketHashes.Subclass && (
            <div className={styles.itemGrid}>
              {unequippedItems.map(mapItem)}
              {equippedItems.length > 0 && unequippedItems.length < capacity - 1 && (
                <AddButton onClick={() => pickLoadoutItem(bucket)} />
              )}
            </div>
          )}
      </div>
    </div>
  );
}
