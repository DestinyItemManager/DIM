import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { bucketsSelector } from 'app/inventory/selectors';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useSelector } from 'react-redux';
import * as styles from './BucketPlaceholder.m.scss';

const badgeLessBuckets = [BucketHashes.Ghost, BucketHashes.Emblems, BucketHashes.Ships];

export function BucketPlaceholder({
  bucketHash,
  onClick,
}: {
  bucketHash: BucketHashes;
  onClick?: React.MouseEventHandler;
}) {
  const buckets = useSelector(bucketsSelector)!;

  const bucket = buckets.byHash[bucketHash];

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={clsx(styles.empty, {
        [styles.clickable]: onClick,
        [styles.hasBadge]: !badgeLessBuckets.includes(bucketHash),
      })}
      title={bucket.name}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <BucketIcon bucketHash={bucketHash} className={styles.placeholder} />
    </Component>
  );
}
