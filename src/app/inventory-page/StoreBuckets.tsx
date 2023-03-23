import { PullFromPostmaster } from 'app/inventory/PullFromPostmaster';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import {
  POSTMASTER_SIZE,
  postmasterAlmostFull,
  postmasterSpaceUsed,
} from 'app/loadout-drawer/postmaster';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import StoreBucket from '../inventory-page/StoreBucket';
import styles from './StoreBuckets.m.scss';

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
    (!bucket.accountWide || bucket.hash === BucketHashes.SpecialOrders) &&
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
        {bucket.hash === BucketHashes.LostItems &&
          store.destinyVersion === 2 &&
          findItemsByBucket(store, bucket.hash).length > 0 && <PullFromPostmaster store={store} />}
      </div>
    ));
  }

  const postMasterSpaceUsed = postmasterSpaceUsed(stores[0]);
  const checkPostmaster = bucket.hash === BucketHashes.LostItems;
  return (
    <div
      className={clsx('store-row', `bucket-${bucket.hash}`, { 'account-wide': bucket.accountWide })}
    >
      {labels && (
        <div className={clsx(styles.bucketLabel)}>
          {bucket.name}
          {checkPostmaster && (
            <span>
              ({postMasterSpaceUsed}/{POSTMASTER_SIZE})
            </span>
          )}
        </div>
      )}
      {content}
    </div>
  );
}
