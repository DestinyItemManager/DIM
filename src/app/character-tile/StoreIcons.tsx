import ClassIcon from 'app/dim-ui/ClassIcon';
import { DimStore } from 'app/inventory/store-types';
import React from 'react';
import styles from './StoreIcons.m.scss';

/**
 * Show both the store emblem and class icon for a given store.
 */
export function StoreIcons({ store, hideClassIcon }: { store: DimStore; hideClassIcon?: boolean }) {
  return (
    <>
      <img
        src={store.icon}
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
      {!hideClassIcon && !store.isVault && (
        <ClassIcon classType={store.classType} className={styles.classIcon} />
      )}
    </>
  );
}
