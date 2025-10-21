import { itemPop, scrollToPosition } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import { locateItem$ } from 'app/inventory/locate-item';
import { DimStore } from 'app/inventory/store-types';
import StoreStats from 'app/store-stats/StoreStats';
import { wrap } from 'app/utils/collections';
import { useEventBusListener } from 'app/utils/hooks';
import { PanInfo, motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import { getCurrentStore, getStore, getVault } from '../inventory/stores-helpers';
import CategoryStrip from './CategoryStrip';
import D1ReputationSection from './D1ReputationSection';
import HeaderShadowDiv from './HeaderShadowDiv';
import * as styles from './PhoneStores.m.scss';
import PhoneStoresHeader from './PhoneStoresHeader';
import { StoreBuckets } from './StoreBuckets';
import './Stores.scss';

/**
 * Display inventory and character headers for all characters and the vault.
 *
 * This is the phone (portrait) view only.
 */
export default function PhoneStores({
  stores,
  buckets,
  singleCharacter,
}: {
  stores: DimStore[];
  buckets: InventoryBuckets;
  singleCharacter: boolean;
}) {
  const vault = getVault(stores);
  const currentStore = getCurrentStore(stores);

  const [{ selectedStoreId, direction }, setSelectedStoreId] = useState({
    selectedStoreId: currentStore?.id,
    direction: 0,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('Weapons');

  // Handle scrolling the right store into view when locating an item
  useEventBusListener(
    locateItem$,
    useCallback(
      (item) => {
        let owner = item.owner;
        if (singleCharacter && owner !== currentStore?.id) {
          owner = 'vault';
        }
        if (selectedStoreId !== item.owner) {
          setSelectedStoreId({
            selectedStoreId: item.owner,
            direction: 1,
          });
          setTimeout(() => itemPop(item), 500);
        } else {
          itemPop(item);
        }
      },
      [currentStore?.id, selectedStoreId, singleCharacter],
    ),
  );

  if (!stores.length || !buckets || !vault || !currentStore) {
    return null;
  }

  let headerStores = stores;
  if (singleCharacter) {
    headerStores = [currentStore, vault];
  }

  const selectedStore = selectedStoreId
    ? (getStore(stores, selectedStoreId) ?? currentStore)
    : currentStore;

  const handleSwipe = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Velocity is in px/ms
    if (Math.abs(info.offset.x) < 10 || Math.abs(info.velocity.x) < 300) {
      return;
    }

    const direction = -Math.sign(info.velocity.x);
    const selectedStoreIndex = selectedStoreId
      ? headerStores.findIndex((s) => s.id === selectedStoreId)
      : headerStores.findIndex((s) => s.current);

    if (direction > 0) {
      setSelectedStoreId({
        selectedStoreId: headerStores[wrap(selectedStoreIndex + 1, headerStores.length)].id,
        direction: 1,
      });
    } else if (direction < 0) {
      setSelectedStoreId({
        selectedStoreId: headerStores[wrap(selectedStoreIndex - 1, headerStores.length)].id,
        direction: -1,
      });
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
    <div className={styles.content} role="main" aria-label={t('Header.Inventory')}>
      <HeaderShadowDiv className="store-row store-header">
        <PhoneStoresHeader
          selectedStore={selectedStore}
          direction={direction}
          stores={headerStores}
          setSelectedStoreId={(selectedStoreId, direction) =>
            setSelectedStoreId({ selectedStoreId, direction })
          }
        />
      </HeaderShadowDiv>

      <motion.div className="horizontal-swipable" onPanEnd={handleSwipe}>
        <StoresInventory
          stores={[selectedStore]}
          selectedCategoryId={selectedCategoryId}
          vault={vault}
          currentStore={currentStore}
          buckets={buckets}
          singleCharacter={singleCharacter}
        />
      </motion.div>

      <CategoryStrip
        category={selectedCategoryId}
        buckets={buckets}
        onCategorySelected={handleCategoryChange}
      />
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

  const renderBucket = (bucket: InventoryBucket) => (
    <StoreBuckets
      key={bucket.hash}
      bucket={bucket}
      stores={stores}
      vault={vault}
      currentStore={currentStore}
      labels={true}
      singleCharacter={singleCharacter}
    />
  );

  const store = stores[0];

  return (
    <>
      {((!store.isVault && selectedCategoryId === 'Armor') ||
        (store.isVault && selectedCategoryId === 'Inventory')) && (
        <div className="store-cell" style={{ paddingBottom: 8 }}>
          <StoreStats store={store} />
        </div>
      )}
      {showPostmaster && buckets.byCategory.Postmaster.map(renderBucket)}
      {buckets.byCategory[selectedCategoryId].map(renderBucket)}
      {store.destinyVersion === 1 && !store.isVault && selectedCategoryId === 'Progress' && (
        <D1ReputationSection stores={[store]} />
      )}
    </>
  );
}
