import BucketLabel from 'app/inventory/BucketLabel';
import { postmasterAlmostFull } from 'app/loadout/postmaster';
import clsx from 'clsx';
import React from 'react';
import { storeBackgroundColor } from '../shell/filters';
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
}: {
  bucket: InventoryBucket;
  stores: DimStore[];
  vault: DimStore;
  currentStore: DimStore;
  labels?: boolean;
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
            <StoreBucket bucket={bucket} store={currentStore} />
          </div>
        )}
        {(allStoresView || stores[0] === vault) && (
          <div className="store-cell vault">
            <StoreBucket bucket={bucket} store={vault} />
          </div>
        )}
      </>
    );
  } else {
    content = stores.map((store, index) => (
      <div
        key={store.id}
        className={clsx('store-cell', {
          vault: store.isVault,
          postmasterFull:
            bucket.sort === 'Postmaster' &&
            store.destinyVersion === 2 &&
            postmasterAlmostFull(store),
        })}
        style={storeBackgroundColor(store, index, false, labels)}
      >
        {(!store.isVault || bucket.vaultBucket) && <StoreBucket bucket={bucket} store={store} />}
        {bucket.type === 'LostItems' &&
          store.destinyVersion === 2 &&
          findItemsByBucket(store, bucket.hash).length > 0 && <PullFromPostmaster store={store} />}
      </div>
    ));
  }

  return (
    <div className={`store-row bucket-${bucket.hash}`}>
      {labels && <BucketLabel store={stores[0]} bucket={bucket} />}
      {content}
    </div>
  );
}
