import BucketLabel from 'app/inventory/BucketLabel';
import { postmasterAlmostFull } from 'app/loadout/postmaster';
import clsx from 'clsx';
import React from 'react';
import { InventoryBucket } from './inventory-buckets';
import { PullFromPostmaster } from './PullFromPostmaster';
import { DimStore } from './store-types';
import StoreBucket from './StoreBucket';
import { findItemsByBucket } from './stores-helpers';

/** One row of store buckets, one for each character and vault. */
export function StoreBuckets({
  bucket,
  stores,
  vault,
  currentStore,
  labels,
  singleCharacter,
}: {
  bucket: InventoryBucket;
  stores: DimStore[];
  vault: DimStore;
  currentStore: DimStore;
  labels?: boolean;
  singleCharacter: boolean;
}) {
  let content: React.ReactNode;

  // Don't show buckets with no items
  if (
    (!bucket.accountWide || bucket.type === 'SpecialOrders') &&
    !stores.some((s) => findItemsByBucket(s, bucket.hash).length > 0)
  ) {
    return null;
  }

  if (bucket.accountWide) {
    // If we're in mobile view, we only render one store
    const allStoresView = stores.length > 1;
    content = (
      <>
        {(allStoresView || stores[0] !== vault) && (
          <div className="store-cell account-wide">
            <StoreBucket bucket={bucket} store={currentStore} singleCharacter={false} />
          </div>
        )}
        {(allStoresView || stores[0] === vault) && (
          <div className="store-cell vault">
            <StoreBucket bucket={bucket} store={vault} singleCharacter={false} />
          </div>
        )}
      </>
    );
  } else {
    content = stores.map((store) => (
      <div
        key={store.id}
        className={clsx('store-cell', {
          vault: store.isVault,
          postmasterFull:
            bucket.sort === 'Postmaster' &&
            store.destinyVersion === 2 &&
            postmasterAlmostFull(store),
        })}
      >
        {(!store.isVault || bucket.vaultBucket) && (
          <StoreBucket bucket={bucket} store={store} singleCharacter={singleCharacter} />
        )}
        {bucket.type === 'LostItems' &&
          store.destinyVersion === 2 &&
          findItemsByBucket(store, bucket.hash).length > 0 && <PullFromPostmaster store={store} />}
      </div>
    ));
  }

  return (
    <div
      className={clsx('store-row', `bucket-${bucket.hash}`, { 'account-wide': bucket.accountWide })}
    >
      {labels && <BucketLabel bucket={bucket} />}
      {content}
    </div>
  );
}
