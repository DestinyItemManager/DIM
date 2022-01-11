import { bucketHashToItemCategoryHash, itemCategoryIcons } from 'app/organizer/item-category-icons';
import React from 'react';
import styles from './BucketPlaceholder.m.scss';

export function BucketPlaceholder({ bucketHash }: { bucketHash: number }) {
  return (
    <div className={styles.empty}>
      {bucketHashToItemCategoryHash[bucketHash] && (
        <img
          className={styles.placeholder}
          src={itemCategoryIcons[bucketHashToItemCategoryHash[bucketHash]]}
        />
      )}
    </div>
  );
}
