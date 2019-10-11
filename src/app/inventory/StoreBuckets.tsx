import React from 'react';
import { DimStore, DimVault } from './store-types';
import StoreBucket from './StoreBucket';
import { InventoryBucket } from './inventory-buckets';
import clsx from 'clsx';
import { PullFromPostmaster } from './PullFromPostmaster';
import { storeBackgroundColor } from '../shell/filters';
import { postmasterAlmostFull } from 'app/loadout/postmaster';

/** One row of store buckets, one for each character and vault. */
export function StoreBuckets({
  bucket,
  stores,
  vault,
  currentStore
}: {
  bucket: InventoryBucket;
  stores: DimStore[];
  vault: DimVault;
  currentStore: DimStore;
}) {
  let content: React.ReactNode;

  // Don't show buckets with no items
  if (
    (!bucket.accountWide || bucket.type === 'SpecialOrders') &&
    !stores.some((s) => s.buckets[bucket.id].length > 0)
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
            <StoreBucket bucketId={bucket.id} storeId={currentStore.id} />
          </div>
        )}
        {(allStoresView || stores[0] === vault) && (
          <div className="store-cell vault">
            <StoreBucket bucketId={bucket.id} storeId={vault.id} />
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
            bucket.sort === 'Postmaster' && store.isDestiny2() && postmasterAlmostFull(store)
        })}
        style={storeBackgroundColor(store, index)}
      >
        {(!store.isVault || bucket.vaultBucket) && (
          <StoreBucket bucketId={bucket.id} storeId={store.id} />
        )}
        {bucket.type === 'LostItems' &&
          store.isDestiny2() &&
          store.buckets[bucket.id].length > 0 && <PullFromPostmaster store={store} />}
      </div>
    ));
  }

  return <div className={`store-row bucket-${bucket.id}`}>{content}</div>;
}
