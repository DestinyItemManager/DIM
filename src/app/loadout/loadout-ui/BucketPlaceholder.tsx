import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { bucketsSelector } from 'app/inventory/selectors';
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
      <BucketIcon bucketHash={bucketHash} className={styles.placeholder} />
    </Component>
  );
}
