import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
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
    <CollapsibleTitle title={'Postmaster'} sectionId={'active-postmaster'} defaultCollapsed={true}>
      {postmasterBuckets.map((bucket) => (
        <StoreBuckets
          key={bucket.hash}
          bucket={bucket}
          stores={[store]}
          vault={vault}
          currentStore={store}
        />
      ))}
    </CollapsibleTitle>
  );
}
// }

// {/* if (!categoryHasItems(buckets, category, stores, currentStore)) {
//   return null;
// }

// return (
//   <InventoryCollapsibleTitle
//     title={t(`Bucket.${category}`)}
//     sectionId={category}
//     stores={stores}
//     defaultCollapsed={defaultCollapsed}
//   >
//     {/*
//         t('Bucket.Inventory')
//         t('Bucket.Postmaster')
//         t('Bucket.General')
//         t('Bucket.Progress')
//         t('Bucket.Unknown')
//       */}
//     {inventoryBucket.map((bucket) => (
//       <StoreBuckets
//         key={bucket.hash}
//         bucket={bucket}
//         stores={stores}
//         vault={vault}
//         currentStore={currentStore}
//         isPhonePortrait={isPhonePortrait}
//         altMode={altMode}
//       />
//     ))}
//   </InventoryCollapsibleTitle>
// );

// function categoryHasItems(
//   allBuckets: InventoryBuckets,
//   category: string,
//   stores: DimStore[],
//   currentStore: DimStore
// ): boolean {
//   const buckets = allBuckets.byCategory[category];
//   return buckets.some((bucket) => {
//     const storesToSearch = bucket.accountWide && !stores[0].isVault ? [currentStore] : stores;
//     return storesToSearch.some((s) => findItemsByBucket(s, bucket.hash).length > 0);
//   });
// }

// <CollapsibleItemCategoryContainer
//   key={'Postmaster'}
//   stores={[selectedStore]}
//   currentStore={selectedStore}
//   vault={vault}
//   category={'Postmaster'}
//   buckets={buckets}
//   inventoryBucket={buckets.byCategory['Postmaster']}
// />; */}
