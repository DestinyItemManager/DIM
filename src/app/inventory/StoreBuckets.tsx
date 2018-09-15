import * as React from 'react';
import { DimStore, DimVault, D2Store } from './store-types';
import StoreBucket from './StoreBucket';
import { Settings } from '../settings/settings';
import { InventoryBucket } from './inventory-buckets';
import classNames from 'classnames';
import { t } from 'i18next';
import { pullablePostmasterItems, pullFromPostmaster } from '../loadout/postmaster';
import { queueAction } from './action-queue';
import { dimItemService } from './dimItemService.factory';
import { toaster } from '../ngimport-more';
import { $q } from 'ngimport';

/** One row of store buckets, one for each character and vault. */
export function StoreBuckets({
  bucket,
  collapsedSections,
  stores,
  vault,
  toggleSection
}: {
  bucket: InventoryBucket;
  collapsedSections: Settings['collapsedSections'];
  stores: DimStore[];
  vault: DimVault;
  toggleSection(id: string): void;
}) {
  let content: React.ReactNode;

  // Don't show buckets with no items
  if (!stores.some((s) => s.buckets[bucket.id].length > 0)) {
    return null;
  }

  if (collapsedSections[bucket.id]) {
    content = (
      <div onClick={() => toggleSection(bucket.id)} className="store-text collapse">
        <span>{t('Bucket.Show', { bucket: bucket.name })}</span>
      </div>
    );
  } else if (bucket.accountWide) {
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
          vault: store.isVault
        })}
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

  return (
    <div className="store-row items">
      <i
        onClick={() => toggleSection(bucket.id)}
        className={classNames(
          'fa collapse',
          collapsedSections[bucket.id] ? 'fa-plus-square-o' : 'fa-minus-square-o'
        )}
      />
      {content}
    </div>
  );
}

function PullFromPostmaster({ store }: { store: D2Store }) {
  const numPullablePostmasterItems = pullablePostmasterItems(store).length;
  if (numPullablePostmasterItems === 0) {
    return null;
  }

  // We need the Angular apply to drive the toaster, until Angular is gone
  function onClick() {
    queueAction(() => $q.when(pullFromPostmaster(store, dimItemService, toaster)));
  }

  return (
    <div className="dim-button bucket-button" onClick={onClick}>
      <i className="fa fa-envelope" /> <span className="badge">{numPullablePostmasterItems}</span>{' '}
      {t('Loadouts.PullFromPostmaster')}
    </div>
  );
}
