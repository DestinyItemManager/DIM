import { bucketsSelector } from 'app/inventory/selectors';
import { bucketHashToItemCategoryHash, itemCategoryIcons } from 'app/organizer/item-category-icons';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './BucketPlaceholder.m.scss';

export function BucketPlaceholder({
  bucketHash,
  onClick,
}: {
  bucketHash: number;
  onClick?: React.MouseEventHandler;
}) {
  const buckets = useSelector(bucketsSelector)!;

  const bucket = buckets.byHash[bucketHash];

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={clsx(styles.empty, { [styles.clickable]: onClick })}
      title={bucket.name}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {bucketHashToItemCategoryHash[bucketHash] && (
        <img
          className={styles.placeholder}
          src={itemCategoryIcons[bucketHashToItemCategoryHash[bucketHash]]}
        />
      )}
    </Component>
  );
}
