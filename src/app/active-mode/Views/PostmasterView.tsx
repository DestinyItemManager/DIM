import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { StoreBuckets } from 'app/inventory/StoreBuckets';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import React from 'react';

export default function PostmasterView({
  buckets,
  store,
  vault,
}: {
  buckets: InventoryBuckets;
  store: DimStore;
  vault: DimStore;
}) {
  const postmasterBuckets = buckets.byCategory['Postmaster'];
  const hasItems = postmasterBuckets.some(
    (bucket) => findItemsByBucket(store, bucket.hash).length > 0
  );
  if (!hasItems) {
    return null;
  }

  return (
    <CollapsibleTitle
      title={t('Bucket.Postmaster')}
      sectionId={'active-postmaster'}
      defaultCollapsed={true}
    >
      {postmasterBuckets.map((bucket) => (
        <StoreBuckets
          key={bucket.hash}
          bucket={bucket}
          stores={[store]}
          vault={vault}
          currentStore={store}
          singleCharacter={false}
        />
      ))}
    </CollapsibleTitle>
  );
}
