import { DimItem } from 'app/inventory/item-types';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { Draft } from 'immer';
import { useMemo } from 'react';
import { ItemsByBucket, LockableBucketHash } from './types';

/** Gets items for the loadout builder and creates a mapping of classType -> bucketHash -> item array. */
export function useItemsByClassType(allItems: DimItem[]) {
  return useMemo(() => {
    const items: Partial<Record<DestinyClass, Draft<ItemsByBucket>>> = {};
    for (const item of allItems) {
      if (!item || !isLoadoutBuilderItem(item)) {
        continue;
      }
      const { classType, bucket } = item;
      (items[classType] ??= {
        [BucketHashes.Helmet]: [],
        [BucketHashes.Gauntlets]: [],
        [BucketHashes.ChestArmor]: [],
        [BucketHashes.LegArmor]: [],
        [BucketHashes.ClassArmor]: [],
      })[bucket.hash as LockableBucketHash].push(item);
    }
    return items as Partial<Record<DestinyClass, ItemsByBucket>>;
  }, [allItems]);
}
