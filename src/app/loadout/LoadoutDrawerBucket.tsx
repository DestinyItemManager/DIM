import React from 'react';
import { DimItem } from '../inventory/item-types';
import { InventoryBucket } from '../inventory/inventory-buckets';
import { AppIcon } from '../shell/icons';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import LoadoutDrawerItem from './LoadoutDrawerItem';
import { Loadout } from './loadout-types';
import { sortItems } from '../shell/filters';

export default function LoadoutDrawerBucket(
  this: never,
  {
    bucket,
    loadout,
    itemSortOrder,
    pickLoadoutItem,
    equip,
    remove
  }: {
    bucket: InventoryBucket;
    loadout: Loadout;
    itemSortOrder: string[];
    pickLoadoutItem(bucket: InventoryBucket): void;
    equip(item: DimItem, e: React.MouseEvent): void;
    remove(item: DimItem, e: React.MouseEvent): void;
  }
) {
  if (!bucket.type) {
    return null;
  }

  const loadoutItems = loadout.items[bucket.type.toLowerCase()] || [];

  const equippedItem = loadoutItems.find((i) => i.equipped);
  const unequippedItems = sortItems(
    loadoutItems.filter((i) => !i.equipped),
    itemSortOrder
  );

  return (
    <div className="loadout-bucket">
      {loadoutItems.length > 0 ? (
        <>
          <div className="loadout-bucket-name">{bucket.name}</div>
          <div className={`loadout-bucket-items bucket-${bucket.type}`}>
            <div className="sub-bucket equipped">
              <div className="equipped-item">
                {equippedItem ? (
                  <LoadoutDrawerItem item={equippedItem} equip={equip} remove={remove} />
                ) : (
                  <a onClick={() => pickLoadoutItem(bucket)} className="pull-item-button">
                    <AppIcon icon={faPlusCircle} />
                  </a>
                )}
              </div>
            </div>
            {(equippedItem || unequippedItems.length > 0) && bucket.type !== 'Class' && (
              <div className="sub-bucket">
                {unequippedItems.map((item) => (
                  <LoadoutDrawerItem key={item.index} item={item} equip={equip} remove={remove} />
                ))}
                {equippedItem && unequippedItems.length < 9 && bucket.type !== 'Class' && (
                  <a onClick={() => pickLoadoutItem(bucket)} className="pull-item-button">
                    <AppIcon icon={faPlusCircle} />
                  </a>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <a onClick={() => pickLoadoutItem(bucket)} className="dim-button loadout-add">
          <AppIcon icon={faPlusCircle} /> {bucket.name}
        </a>
      )}
    </div>
  );
}
