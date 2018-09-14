import * as React from 'react';
import { DimStore, DimVault, D2Store } from './store-types';
import StoreBucket from './StoreBucket';
import { Settings } from '../settings/settings';
import { InventoryBucket } from './inventory-buckets';
import classNames from 'classnames';
import { InventoryState } from './reducer';
import { ReviewsState } from '../item-review/reducer';
import { DimItem } from './item-types';
import { pullablePostmasterItems, pullFromPostmaster } from '../loadout/postmaster';
import { queueAction } from './action-queue';
import { dimItemService } from './dimItemService.factory';
import { toaster } from '../ngimport-more';
import { $rootScope } from 'ngimport';

/** One row of store buckets, one for each character and vault. */
export function StoreBuckets({
  bucket,
  stores,
  vault,
  currentStore,
  settings,
  newItems,
  itemInfos,
  ratings,
  searchFilter
}: {
  bucket: InventoryBucket;
  stores: DimStore[];
  vault: DimVault;
  currentStore: DimStore;
  settings: Settings;
  newItems: Set<string>;
  itemInfos: InventoryState['itemInfos'];
  ratings: ReviewsState['ratings'];
  searchFilter(item: DimItem): boolean;
}) {
  let content: React.ReactNode;

  // Don't show buckets with no items
  if (!stores.some((s) => s.buckets[bucket.id].length > 0)) {
    return null;
  }

  if (bucket.accountWide) {
    // If we're in mobile view, we only render one store
    const allStoresView = stores.length > 1;
    content = (
      <>
        {(allStoresView || stores[0] !== vault) && (
          <div className="store-cell account-wide">
            <StoreBucket
              bucket={bucket}
              store={stores[0]}
              items={currentStore.buckets[bucket.id]}
              settings={settings}
              newItems={newItems}
              itemInfos={itemInfos}
              ratings={ratings}
              searchFilter={searchFilter}
            />
          </div>
        )}
        {(allStoresView || stores[0] === vault) && (
          <div className="store-cell vault">
            <StoreBucket
              bucket={bucket}
              store={vault}
              items={vault.buckets[bucket.id]}
              settings={settings}
              newItems={newItems}
              itemInfos={itemInfos}
              ratings={ratings}
              searchFilter={searchFilter}
            />
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
          <StoreBucket
            bucket={bucket}
            store={store}
            items={store.buckets[bucket.id]}
            settings={settings}
            newItems={newItems}
            itemInfos={itemInfos}
            ratings={ratings}
            searchFilter={searchFilter}
          />
        )}
        {bucket.type === 'LostItems' &&
          store.isDestiny2() &&
          store.buckets[bucket.id].length > 0 && <PullFromPostmaster store={store} />}
      </div>
    ));
  }

  return <div className="store-row items">{content}</div>;
}

function PullFromPostmaster({ store }: { store: D2Store }) {
  const numPullablePostmasterItems = pullablePostmasterItems(store).length;
  if (numPullablePostmasterItems === 0) {
    return null;
  }

  // We need the Angular apply to drive the toaster, until Angular is gone
  function onClick() {
    queueAction(() => $rootScope.$apply(() => pullFromPostmaster(store, dimItemService, toaster)));
  }

  return (
    <div className="dim-button bucket-button" onClick={onClick}>
      <i className="fa fa-envelope" /> <span className="badge">{numPullablePostmasterItems}</span>{' '}
      {t('Loadouts.PullFromPostmaster')}
    </div>
  );
}
