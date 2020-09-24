import { scrollToPosition } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import StoreStats from 'app/store-stats/StoreStats';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import Hammer from 'react-hammerjs';
import { connect } from 'react-redux';
import { Frame, Track, View, ViewPager } from 'react-view-pager';
import StoreHeading from '../character-tile/StoreHeading';
import ScrollClassDiv from '../dim-ui/ScrollClassDiv';
import { hideItemPopup } from '../item-popup/item-popup';
import { storeBackgroundColor } from '../shell/filters';
import D1ReputationSection from './D1ReputationSection';
import { InventoryBucket, InventoryBuckets } from './inventory-buckets';
import InventoryCollapsibleTitle from './InventoryCollapsibleTitle';
import { bucketsSelector, sortedStoresSelector } from './selectors';
import { DimStore } from './store-types';
import { StoreBuckets } from './StoreBuckets';
import { findItemsByBucket, getCurrentStore, getStore, getVault } from './stores-helpers';
import './Stores.scss';

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    $featureFlags.mobileCategoryStrip ? 'Weapons' : undefined
  );
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

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategoryId) {
      // If user selects the category they are already on, scroll to top
      scrollToPosition({ top: 0 });
      return;
    }
    setSelectedCategoryId(category);
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
          style={storeBackgroundColor(selectedStore, 0, true, isPhonePortrait)}
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
            <StoresInventory
              stores={[selectedStore]}
              selectedCategoryId={selectedCategoryId}
              vault={vault}
              currentStore={currentStore}
              buckets={buckets}
            />
          </div>
        </Hammer>

        {$featureFlags.mobileCategoryStrip && (
          <div className="category-options">
            {Object.keys(buckets.byCategory)
              .filter((category) => category !== 'Postmaster')
              .map((category) => (
                <div
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={clsx({ selected: category === selectedCategoryId })}
                >
                  {t(`Bucket.${category}`)}
                </div>
              ))}
          </div>
        )}
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
    return storesToSearch.some((s) => findItemsByBucket(s, bucket.hash).length > 0);
  });
}

export default connect<StoreProps>(mapStateToProps)(Stores);

interface InventoryContainerProps {
  selectedCategoryId?: string;
  buckets: InventoryBuckets;
  stores: DimStore[];
  currentStore: DimStore;
  vault: DimStore;
}

function CollapsibleContainer({
  buckets,
  category,
  stores,
  currentStore,
  inventoryBucket,
  vault,
}: { category: string; inventoryBucket: InventoryBucket[] } & InventoryContainerProps) {
  if (!categoryHasItems(buckets, category, stores, currentStore)) {
    return null;
  }

  return (
    <InventoryCollapsibleTitle title={t(`Bucket.${category}`)} sectionId={category} stores={stores}>
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
        />
      ))}
    </InventoryCollapsibleTitle>
  );
}

function StoresInventory(props: InventoryContainerProps) {
  const { selectedCategoryId, buckets, stores, currentStore, vault } = props;

  if (selectedCategoryId) {
    return (
      <>
        <CollapsibleContainer
          {...props}
          buckets={buckets}
          category={'Postmaster'}
          inventoryBucket={buckets.byCategory['Postmaster']}
        />
        {$featureFlags.unstickyStats && selectedCategoryId === 'Armor' && (
          <StoreStats
            store={currentStore}
            style={{ ...storeBackgroundColor(currentStore, 0, true), paddingBottom: 8 }}
          />
        )}
        {buckets.byCategory[selectedCategoryId].map((bucket) => (
          <StoreBuckets
            key={bucket.hash}
            bucket={bucket}
            stores={stores}
            vault={vault}
            currentStore={currentStore}
            labels={true}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {Object.entries(buckets.byCategory).map(([category, inventoryBucket]) => (
        <CollapsibleContainer
          key={category}
          {...props}
          category={category}
          inventoryBucket={inventoryBucket}
        />
      ))}
      {stores[0].destinyVersion === 1 && <D1ReputationSection stores={stores} />}
    </>
  );
}
