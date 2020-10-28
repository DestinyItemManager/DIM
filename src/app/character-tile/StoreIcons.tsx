import ClassIcon from 'app/dim-ui/ClassIcon';
import { DimStore } from 'app/inventory/store-types';
import React from 'react';
import styles from './StoreIcons.m.scss';

/**
 * Show both the store emblem and class icon for a given store.
 */
export function StoreIcons({
  store,
  showClass = true,
  label,
  useBackground,
}: {
  store: DimStore;
  showClass?: boolean;
  label?: string;
  useBackground?: boolean;
}) {
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
      {label ? (
        <span className={styles.label}>{label}</span>
      ) : (
        !store.isVault &&
        showClass && <ClassIcon classType={store.classType} className={styles.classIcon} />
      )}
    </>
  );
}
