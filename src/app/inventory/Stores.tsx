import React, { useRef, useState, useEffect } from 'react';
import { DimStore, DimVault } from './store-types';
import { InventoryBuckets } from './inventory-buckets';
import { t } from 'app/i18next-t';
import './Stores.scss';
import StoreHeading from '../character-tile/StoreHeading';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import { Frame, Track, View, ViewPager } from 'react-view-pager';
import ScrollClassDiv from '../dim-ui/ScrollClassDiv';
import { StoreBuckets } from './StoreBuckets';
import D1ReputationSection from './D1ReputationSection';
import Hammer from 'react-hammerjs';
import { sortedStoresSelector, bucketsSelector } from './selectors';
import { hideItemPopup } from '../item-popup/item-popup';
import { storeBackgroundColor } from '../shell/filters';
import InventoryCollapsibleTitle from './InventoryCollapsibleTitle';
import clsx from 'clsx';
import { getCurrentStore, getVault, getStore } from './stores-helpers';
import StoreStats from 'app/store-stats/StoreStats';

interface StoreProps {
  stores: DimStore[];
  isPhonePortrait: boolean;
  buckets: InventoryBuckets;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: sortedStoresSelector(state),
    buckets: bucketsSelector(state)!,
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

type Props = StoreProps;

/**
 * Display inventory and character headers for all characters and the vault.
 */
function Stores(this: void, { stores, buckets, isPhonePortrait }: Props) {
  const vault = getVault(stores)!;
  const currentStore = getCurrentStore(stores)!;

  const [selectedStoreId, setSelectedStoreId] = useState(currentStore?.id);
  const detachedLoadoutMenu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      /* Set a CSS variable so we can style things based on the height of the header */
      const element = document.querySelector('.store-header');
      if (element) {
        document
          .querySelector('html')!
          .style.setProperty('--store-header-height', element.clientHeight + 'px');
      }
    }, 0);
  });

  if (!stores.length || !buckets) {
    return null;
  }

  const selectedStore = selectedStoreId ? getStore(stores, selectedStoreId)! : currentStore;

  const onViewChange = (indices: number[]) => {
    setSelectedStoreId(stores[indices[0]].id);
    hideItemPopup();
  };

  const handleSwipe: HammerListener = (e) => {
    const selectedStoreIndex = selectedStoreId
      ? stores.findIndex((s) => s.id === selectedStoreId)
      : stores.findIndex((s) => s.current);

    if (e.direction === 2 && selectedStoreIndex < stores.length - 1) {
      setSelectedStoreId(stores[selectedStoreIndex + 1].id);
    } else if (e.direction === 4 && selectedStoreIndex > 0) {
      setSelectedStoreId(stores[selectedStoreIndex - 1].id);
    }
  };

  if (isPhonePortrait) {
    return (
      <div
        className={`inventory-content phone-portrait destiny${selectedStore.destinyVersion}`}
        role="main"
        aria-label={t('Header.Inventory')}
      >
        <ScrollClassDiv
          className="store-row store-header"
          scrollClass="sticky"
          style={storeBackgroundColor(selectedStore, 0, true)}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <ViewPager>
            <Frame className="frame" autoSize={false}>
              <Track
                currentView={selectedStore.id}
                contain={false}
                onViewChange={onViewChange}
                className="track"
              >
                {stores.map((store) => (
                  <View className="store-cell" key={store.id}>
                    <StoreHeading
                      store={store}
                      selectedStore={selectedStore}
                      onTapped={setSelectedStoreId}
                      loadoutMenuRef={detachedLoadoutMenu}
                    />
                    {!$featureFlags.unstickyStats && <StoreStats store={store} />}
                  </View>
                ))}
              </Track>
            </Frame>
          </ViewPager>
        </ScrollClassDiv>

        <div className="detached" ref={detachedLoadoutMenu} />

        <Hammer direction="DIRECTION_HORIZONTAL" onSwipe={handleSwipe}>
          <div>
            {$featureFlags.unstickyStats && (
              <StoreStats
                store={selectedStore}
                style={storeBackgroundColor(selectedStore, 0, true)}
              />
            )}
            <StoresInventory
              stores={[selectedStore]}
              vault={vault}
              currentStore={currentStore}
              buckets={buckets}
            />
          </div>
        </Hammer>
      </div>
    );
  }

  return (
    <div
      className={`inventory-content destiny${selectedStore.destinyVersion}`}
      role="main"
      aria-label={t('Header.Inventory')}
    >
      <ScrollClassDiv className="store-row store-header" scrollClass="sticky">
        {stores.map((store, index) => (
          <div
            className={clsx('store-cell', { vault: store.isVault })}
            key={store.id}
            style={storeBackgroundColor(store, index)}
          >
            <StoreHeading store={store} />
            <StoreStats store={store} />
          </div>
        ))}
      </ScrollClassDiv>
      <StoresInventory
        stores={stores}
        vault={vault}
        currentStore={currentStore}
        buckets={buckets}
      />
    </div>
  );
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
    return storesToSearch.some((s) => s.buckets[bucket.hash] && s.buckets[bucket.hash].length > 0);
  });
}

export default connect<StoreProps>(mapStateToProps)(Stores);

function StoresInventory({
  buckets,
  stores,
  currentStore,
  vault,
}: {
  buckets: InventoryBuckets;
  stores: DimStore[];
  currentStore: DimStore;
  vault: DimVault;
}) {
  return (
    <>
      {Object.keys(buckets.byCategory).map(
        (category) =>
          categoryHasItems(buckets, category, stores, currentStore) && (
            <InventoryCollapsibleTitle
              key={category}
              title={t(`Bucket.${category}`)}
              sectionId={category}
              stores={stores}
            >
              {/*
                  t('Bucket.Inventory')
                  t('Bucket.Postmaster')
                  t('Bucket.General')
                  t('Bucket.Progress')
                  t('Bucket.Unknown')
                */}
              {buckets.byCategory[category].map((bucket) => (
                <StoreBuckets
                  key={bucket.hash}
                  bucket={bucket}
                  stores={stores}
                  vault={vault}
                  currentStore={currentStore}
                />
              ))}
            </InventoryCollapsibleTitle>
          )
      )}
      {stores[0].isDestiny1() && <D1ReputationSection stores={stores} />}
    </>
  );
}
