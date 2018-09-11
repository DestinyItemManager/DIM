import * as React from 'react';
import { DimStore, DimVault } from './store-types';
import StoreBucket from './StoreBucket';
import { Settings } from '../settings/settings';
import { InventoryBucket } from './inventory-buckets';
import classNames from 'classnames';
import { t } from 'i18next';
import { InventoryState } from './reducer';
import { ReviewsState } from '../item-review/reducer';
import { DimItem } from './item-types';

/** One row of store buckets, one for each character and vault. */
export function StoreBuckets({
  bucket,
  collapsedSections,
  stores,
  vault,
  currentStore,
  settings,
  newItems,
  itemInfos,
  ratings,
  searchFilter,
  toggleSection
}: {
  bucket: InventoryBucket;
  stores: DimStore[];
  collapsedSections: Settings['collapsedSections'];
  vault: DimVault;
  currentStore: DimStore;
  settings: Settings;
  newItems: Set<string>;
  itemInfos: InventoryState['itemInfos'];
  ratings: ReviewsState['ratings'];
  searchFilter(item: DimItem): boolean;
  toggleSection(id: string): void;
}) {

  let content: React.ReactNode;
  if (collapsedSections[bucket.id]) {
    content = (
      <div
        onClick={() => toggleSection(bucket.id)}
        className="store-text collapse"
      >
        <span>{t('Bucket.Show', { bucket: bucket.name })}</span>
      </div>
    );
  } else if (bucket.accountWide) {
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
    content = (
      stores.map((store) => (
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
        </div>
      ))
    );
  }

  return (
    <div className="store-row items">
      <i
        onClick={() => toggleSection(bucket.id)}
        className={classNames(
          'fa collapse',
          collapsedSections[bucket.id]
            ? 'fa-plus-square-o'
            : 'fa-minus-square-o'
        )}
      />
      {content}
    </div>
  );
}
