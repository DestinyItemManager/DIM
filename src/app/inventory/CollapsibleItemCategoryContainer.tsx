import { t } from 'app/i18next-t';
import { InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';
import InventoryCollapsibleTitle from 'app/inventory/InventoryCollapsibleTitle';
import { DimStore } from 'app/inventory/store-types';
import { StoreBuckets } from 'app/inventory/StoreBuckets';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import React from 'react';

interface Props {
  buckets: InventoryBuckets;
  category: string;
  currentStore: DimStore;
  inventoryBucket: InventoryBucket[];
  isPhonePortrait?: boolean;
  stores: DimStore[];
  vault: DimStore;
  defaultCollapsed?: boolean;
  altMode?: boolean;
}

/** Is there any store that has an item in any of the buckets in this category? */
function categoryHasItems(
  allBuckets: InventoryBuckets,
  category: string,
  stores: DimStore[],
  currentStore: DimStore
): boolean {
  const buckets = allBuckets.byCategory[category];
  return buckets.some((bucket) => {
    const storesToSearch = bucket.accountWide && !stores[0].isVault ? [currentStore] : stores;
    return storesToSearch.some((s) => findItemsByBucket(s, bucket.hash).length > 0);
  });
}

export default function CollapsibleItemCategoryContainer({
  buckets,
  category,
  currentStore,
  inventoryBucket,
  isPhonePortrait,
  stores,
  vault,
  defaultCollapsed,
  altMode,
}: Props) {
  if (!categoryHasItems(buckets, category, stores, currentStore)) {
    return null;
  }

  return (
    <InventoryCollapsibleTitle
      title={t(`Bucket.${category}`)}
      sectionId={category}
      stores={stores}
      defaultCollapsed={defaultCollapsed}
    >
      {/*
          t('Bucket.Inventory')
          t('Bucket.Postmaster')
          t('Bucket.General')
          t('Bucket.Progress')
          t('Bucket.Unknown')
        */}
      {inventoryBucket.map((bucket) => (
        <StoreBuckets
          key={bucket.hash}
          bucket={bucket}
          stores={stores}
          vault={vault}
          currentStore={currentStore}
          isPhonePortrait={isPhonePortrait}
          altMode={altMode}
        />
      ))}
    </InventoryCollapsibleTitle>
  );
}
