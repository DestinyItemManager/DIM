import React from 'react';
import catIconHelmet from '../../images/catIconHelmet.svg';
import catIconGauntlets from '../../images/catIconGauntlets.svg';
import catIconChest from '../../images/catIconChest.svg';
import catIconBoots from '../../images/catIconBoots.svg';
import catIconClass from '../../images/catIconClass.svg';
import catIconGhost from '../../images/catIconGhost.svg';
import { InventoryBucket } from 'app/inventory/inventory-buckets';

export default function ArmorBucketIcon({
  bucket,
  className,
}: {
  bucket: InventoryBucket;
  className?: string;
}) {
  const icon = iconForBucketHash(bucket.hash);

  return <img className={className} src={icon} title={bucket.name} />;
}

function iconForBucketHash(bucketHash: number) {
  switch (bucketHash) {
    case 3448274439:
      return catIconHelmet;
    case 3551918588:
      return catIconGauntlets;
    case 14239492:
      return catIconChest;
    case 20886954:
      return catIconBoots;
    case 1585787867:
      return catIconClass;
    case 4023194814:
      return catIconGhost;
  }
  return undefined;
}
