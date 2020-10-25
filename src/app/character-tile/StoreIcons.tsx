import ClassIcon from 'app/dim-ui/ClassIcon';
import { DimStore } from 'app/inventory/store-types';
import React from 'react';
import styles from './StoreIcons.m.scss';

/**
 * Show both the store emblem and class icon for a given store.
 */
export function StoreIcons({ store, useBackground }: { store: DimStore; useBackground?: boolean }) {
  return (
    <>
      <img
        src={!useBackground ? store.icon : store.background}
        height="32"
        width="32"
        style={{
          backgroundColor: store.color
            ? `rgb(${Math.round(store.color.red)}, ${Math.round(store.color.green)}, ${Math.round(
                store.color.blue
              )}`
            : 'black',
        }}
      />
      {!store.isVault && <ClassIcon classType={store.classType} className={styles.classIcon} />}
    </>
  );
}
