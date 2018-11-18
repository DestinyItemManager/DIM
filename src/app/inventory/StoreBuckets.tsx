import * as React from 'react';
import { DimStore, DimVault } from './store-types';
import StoreBucket from './StoreBucket';
import { InventoryBucket } from './inventory-buckets';
import classNames from 'classnames';
import { PullFromPostmaster } from './PullFromPostmaster';
import { DestinyColor } from 'bungie-api-ts/destiny2';

/** One row of store buckets, one for each character and vault. */
export function StoreBuckets({
  bucket,
  stores,
  vault
}: {
  bucket: InventoryBucket;
  stores: DimStore[];
  vault: DimVault;
}) {
  let content: React.ReactNode;

  // Don't show buckets with no items
  if (!stores.some((s) => s.buckets[bucket.id].length > 0)) {
    return null;
  }

  const noBadges = stores.every((s) => s.buckets[bucket.id].every((i) => !i.primStat));

  if (bucket.accountWide) {
    // If we're in mobile view, we only render one store
    const allStoresView = stores.length > 1;
    const currentStore = stores.find((s) => s.current)!;
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
    content = stores.map((store) => (
      <div
        key={store.id}
        className={classNames('store-cell', {
          vault: store.isVault,
          'no-badge': noBadges
        })}
        style={store.isDestiny2() && store.color ? bgColor(store.color) : undefined}
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

  return <div className="store-row items">{content}</div>;
}

function bgColor(color: DestinyColor) {
  return { backgroundColor: `rgba(${color.red}, ${color.green}, ${color.blue}, 0.2)` };
}
