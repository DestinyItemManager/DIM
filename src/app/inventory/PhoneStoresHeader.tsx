import React from 'react';
import StoreHeading from '../character-tile/StoreHeading';
import styles from './PhoneStoresHeader.m.scss';
import { DimStore } from './store-types';

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
  /*
  const onViewChange = (indices: number[]) => {
    setSelectedStoreId(stores[indices[0]].id);
    hideItemPopup();
  };
  */

  // TODO: carousel
  // TODO: wrap StoreHeading in a div?

  return (
    <div className={styles.frame}>
      <div className={styles.track} style={{ width: `${100 * stores.length}%` }}>
        {stores.map((store) => (
          <div
            className="store-cell"
            key={store.id}
            style={{ width: `${Math.floor(100 / stores.length)}%` }}
          >
            <StoreHeading
              store={store}
              selectedStore={selectedStore}
              onTapped={setSelectedStoreId}
              loadoutMenuRef={loadoutMenuRef}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
