import { scrollToPosition } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import HeaderShadowDiv from 'app/inventory/HeaderShadowDiv';
import StoreStats from 'app/store-stats/StoreStats';
import { wrap } from 'app/utils/util';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import Hammer from 'react-hammerjs';
import { InventoryBuckets } from './inventory-buckets';
import PhoneStoresHeader from './PhoneStoresHeader';
import { DimStore } from './store-types';
import { StoreBuckets } from './StoreBuckets';
import { getCurrentStore, getStore, getVault } from './stores-helpers';
import './Stores.scss';

interface Props {
  stores: DimStore[];
  buckets: InventoryBuckets;
  singleCharacter: boolean;
}

/**
 * Display inventory and character headers for all characters and the vault.
 *
 * This is the phone (portrait) view only.
 */
export default function PhoneStores({ stores, buckets, singleCharacter }: Props) {
  const vault = getVault(stores)!;
  const currentStore = getCurrentStore(stores)!;

  const [selectedStoreId, setSelectedStoreId] = useState(currentStore?.id);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('Weapons');
  const detachedLoadoutMenu = useRef<HTMLDivElement>(null);

  if (!stores.length || !buckets) {
    return null;
  }

  let headerStores = stores;
  if (singleCharacter) {
    headerStores = [currentStore, vault];
  }

  const selectedStore = selectedStoreId ? getStore(stores, selectedStoreId)! : currentStore;

  const handleSwipe: HammerListener = (e) => {
    const selectedStoreIndex = selectedStoreId
      ? stores.findIndex((s) => s.id === selectedStoreId)
      : stores.findIndex((s) => s.current);

    if (e.direction === 2) {
      setSelectedStoreId(headerStores[wrap(selectedStoreIndex + 1, stores.length)].id);
    } else if (e.direction === 4) {
      setSelectedStoreId(headerStores[wrap(selectedStoreIndex - 1, stores.length)].id);
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
      <HeaderShadowDiv className="store-row store-header" onTouchStart={(e) => e.stopPropagation()}>
        <PhoneStoresHeader
          selectedStore={selectedStore}
          stores={headerStores}
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
            singleCharacter={singleCharacter}
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
  singleCharacter,
}: {
  selectedCategoryId: string;
  buckets: InventoryBuckets;
  stores: DimStore[];
  currentStore: DimStore;
  vault: DimStore;
  singleCharacter: boolean;
}) {
  const showPostmaster =
    (currentStore.destinyVersion === 2 && selectedCategoryId === 'Inventory') ||
    (currentStore.destinyVersion === 1 && selectedCategoryId === 'General');

  return (
    <>
      {selectedCategoryId === 'Armor' && (
        <StoreStats store={stores[0]} style={{ paddingBottom: 8 }} />
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
            singleCharacter={singleCharacter}
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
          singleCharacter={singleCharacter}
        />
      ))}
    </>
  );
}
