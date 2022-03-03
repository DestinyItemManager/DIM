import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { LoadoutItem } from 'app/loadout/loadout-types';
import { itemSortOrderSelector } from 'app/settings/item-sort';
import { sortItems } from 'app/shell/filters';
import { addIcon, AppIcon } from 'app/shell/icons';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useSelector } from 'react-redux';
import { AddButton } from './Buttons';
import styles from './LoadoutDrawerBucket.m.scss';
import LoadoutDrawerItem from './LoadoutDrawerItem';

export default function LoadoutDrawerBucket({
  bucket,
  loadoutItems,
  items,
  pickLoadoutItem,
  equip,
  remove,
}: {
  bucket: InventoryBucket;
  loadoutItems: LoadoutItem[];
  items: DimItem[];
  pickLoadoutItem(bucket: InventoryBucket): void;
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
}) {
  const itemSortOrder = useSelector(itemSortOrderSelector);
  const equippedItems = sortItems(
    items.filter((i) =>
      loadoutItems.some((li) => li.id === i.id && li.hash === i.hash && li.equip)
    ),
    itemSortOrder
  );
  const unequippedItems = sortItems(
    items.filter((i) =>
      loadoutItems.some((li) => li.id === i.id && li.hash === i.hash && !li.equip)
    ),
    itemSortOrder
  );
  // Only allow one emblem
  const capacity = bucket.hash === BucketHashes.Emblems ? 1 : bucket.capacity;

  return (
    <div className="loadout-bucket">
      {equippedItems.length > 0 || unequippedItems.length > 0 ? (
        <>
          <div className="loadout-bucket-name">{bucket.name}</div>
          <div
            className={clsx('loadout-bucket-items', {
              'bucket-Class': bucket.hash === BucketHashes.Subclass,
            })}
          >
            <div className="sub-bucket equipped">
              <div className="equipped-item">
                {equippedItems.length > 0 ? (
                  equippedItems.map((item) => (
                    <LoadoutDrawerItem key={item.index} item={item} equip={equip} remove={remove} />
                  ))
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
                <div className="sub-bucket">
                  {unequippedItems.map((item) => (
                    <LoadoutDrawerItem key={item.index} item={item} equip={equip} remove={remove} />
                  ))}
                  {equippedItems.length > 0 && unequippedItems.length < capacity - 1 && (
                    <AddButton onClick={() => pickLoadoutItem(bucket)} />
                  )}
                </div>
              )}
          </div>
        </>
      ) : (
        <a onClick={() => pickLoadoutItem(bucket)} className="dim-button loadout-add">
          <AppIcon icon={addIcon} /> {bucket.name}
        </a>
      )}
    </div>
  );
}
