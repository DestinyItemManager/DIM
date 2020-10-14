import { hideItemPopup } from 'app/item-popup/item-popup';
import React from 'react';
import { Frame, Track, View, ViewPager } from 'react-view-pager';
import StoreHeading from '../character-tile/StoreHeading';
import { DimStore } from './store-types';
import './Stores.scss';

/**
 * The swipable header for the mobile (phone portrait) Inventory view.
 */
export default function PhoneStoresHeader({
  selectedStore,
  stores,
  setSelectedStoreId,
  loadoutMenuRef,
}: {
  selectedStore: DimStore;
  stores: DimStore[];
  loadoutMenuRef: React.RefObject<HTMLElement>;
  setSelectedStoreId(id: string): void;
}) {
  const onViewChange = (indices: number[]) => {
    setSelectedStoreId(stores[indices[0]].id);
    hideItemPopup();
  };

  return (
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
                loadoutMenuRef={loadoutMenuRef}
              />
            </View>
          ))}
        </Track>
      </Frame>
    </ViewPager>
  );
}
