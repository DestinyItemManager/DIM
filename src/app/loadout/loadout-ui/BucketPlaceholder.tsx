import { bucketsSelector } from 'app/inventory/selectors';
import { bucketHashToItemCategoryHash, itemCategoryIcons } from 'app/organizer/item-category-icons';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './BucketPlaceholder.m.scss';

export function BucketPlaceholder({ bucketHash }: { bucketHash: number }) {
  const buckets = useSelector(bucketsSelector)!;

  const bucket = buckets.byHash[bucketHash];

  return (
    <div className={styles.empty} title={bucket.name}>
      {bucketHashToItemCategoryHash[bucketHash] && (
        <img
          className={styles.placeholder}
          src={itemCategoryIcons[bucketHashToItemCategoryHash[bucketHash]]}
        />
      )}
    </div>
  );
}
