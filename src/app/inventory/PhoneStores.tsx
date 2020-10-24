import { scrollToPosition } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import HeaderShadowDiv from 'app/inventory/HeaderShadowDiv';
import StoreStats from 'app/store-stats/StoreStats';
import { wrap } from 'app/utils/util';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import Hammer from 'react-hammerjs';
import { storeBackgroundColor } from '../shell/filters';
import { InventoryBuckets } from './inventory-buckets';
import PhoneStoresHeader from './PhoneStoresHeader';
import { DimStore } from './store-types';
import { StoreBuckets } from './StoreBuckets';
import { getCurrentStore, getStore, getVault } from './stores-helpers';
import './Stores.scss';

interface Props {
  stores: DimStore[];
  buckets: InventoryBuckets;
}

/**
 * Display inventory and character headers for all characters and the vault.
 *
 * This is the phone (portrait) view only.
 */
export default function PhoneStores({ stores, buckets }: Props) {
  const vault = getVault(stores)!;
  const currentStore = getCurrentStore(stores)!;

  const [selectedStoreId, setSelectedStoreId] = useState(currentStore?.id);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('Weapons');
  const detachedLoadoutMenu = useRef<HTMLDivElement>(null);

  if (!stores.length || !buckets) {
    return null;
  }

  const selectedStore = selectedStoreId ? getStore(stores, selectedStoreId)! : currentStore;

  const handleSwipe: HammerListener = (e) => {
    const selectedStoreIndex = selectedStoreId
      ? stores.findIndex((s) => s.id === selectedStoreId)
      : stores.findIndex((s) => s.current);

    if (e.direction === 2) {
      setSelectedStoreId(stores[wrap(selectedStoreIndex + 1, stores.length)].id);
    } else if (e.direction === 4) {
      setSelectedStoreId(stores[wrap(selectedStoreIndex - 1, stores.length)].id);
    }
  };

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategoryId) {
      // If user selects the category they are already on, scroll to top
      scrollToPosition({ top: 0 });
      return;
    }
    setSelectedCategoryId(category);
  };

  return (
    <div
      className={`inventory-content phone-portrait destiny${selectedStore.destinyVersion}`}
      role="main"
      aria-label={t('Header.Inventory')}
    >
      <HeaderShadowDiv
        className="store-row store-header"
        style={storeBackgroundColor(selectedStore, 0, true, true)}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <PhoneStoresHeader
          selectedStore={selectedStore}
          stores={stores}
          loadoutMenuRef={detachedLoadoutMenu}
          setSelectedStoreId={setSelectedStoreId}
        />
      </HeaderShadowDiv>

      <div className="detached" ref={detachedLoadoutMenu} />

      <Hammer direction="DIRECTION_HORIZONTAL" onSwipe={handleSwipe}>
        <div>
          <StoresInventory
            stores={[selectedStore]}
            selectedCategoryId={selectedCategoryId}
            vault={vault}
            currentStore={currentStore}
            buckets={buckets}
          />
        </div>
      </Hammer>

      <CategoryStrip
        category={selectedCategoryId}
        buckets={buckets}
        onCategorySelected={handleCategoryChange}
      />
    </div>
  );
}

function CategoryStrip({
  buckets,
  category: selectedCategoryId,
  onCategorySelected,
}: {
  buckets: InventoryBuckets;
  category: string;
  onCategorySelected(category: string): void;
}) {
  return (
    <div className="category-options">
      {Object.keys(buckets.byCategory)
        .filter((category) => category !== 'Postmaster')
        .map((category) => (
          <div
            key={category}
            onClick={() => onCategorySelected(category)}
            className={clsx({ selected: category === selectedCategoryId })}
          >
            {t(`Bucket.${category}`)}
          </div>
        ))}
    </div>
  );
}

function StoresInventory({
  selectedCategoryId,
  buckets,
  stores,
  currentStore,
  vault,
}: {
  selectedCategoryId: string;
  buckets: InventoryBuckets;
  stores: DimStore[];
  currentStore: DimStore;
  vault: DimStore;
}) {
  const showPostmaster =
    (currentStore.destinyVersion === 2 && selectedCategoryId === 'Inventory') ||
    (currentStore.destinyVersion === 1 && selectedCategoryId === 'General');

  return (
    <>
      {selectedCategoryId === 'Armor' && (
        <StoreStats
          store={stores[0]}
          style={{ ...storeBackgroundColor(stores[0], 0, true, true), paddingBottom: 8 }}
        />
      )}
      {showPostmaster &&
        buckets.byCategory['Postmaster'].map((bucket) => (
          <StoreBuckets
            key={bucket.hash}
            bucket={bucket}
            stores={stores}
            vault={vault}
            currentStore={currentStore}
            labels={true}
            isPhonePortrait={true}
          />
        ))}
      {buckets.byCategory[selectedCategoryId].map((bucket) => (
        <StoreBuckets
          key={bucket.hash}
          bucket={bucket}
          stores={stores}
          vault={vault}
          currentStore={currentStore}
          labels={true}
          isPhonePortrait={true}
        />
      ))}
    </>
  );
}
