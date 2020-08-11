import React from 'react';
import clsx from 'clsx';
import type { DimStore, DimVault } from 'app/inventory/store-types';
import CharacterStats from '../store-stats/CharacterStats';
import AccountCurrencies from './AccountCurrencies';
import VaultCapacity from './VaultCapacity';
import styles from './StoreStats.m.scss';
import { isPhonePortraitFromMediaQuery } from 'app/utils/media-queries';

function isVault(store: DimStore): store is DimVault {
  return store.isVault;
}

function shouldShowCapacity() {
  if (!isPhonePortraitFromMediaQuery()) {
    return true;
  }
  return !$featureFlags.unstickyStats;
}

/** Render the store stats for any store type (character or vault) */
export default function StoreStats({
  store,
  style,
}: {
  store: DimStore;
  style?: React.CSSProperties;
}) {
  return (
    <div className={clsx({ ['store-cell']: Boolean(style), vault: store.isVault })} style={style}>
      {isVault(store) ? (
        <div className={styles.vaultStats}>
          <AccountCurrencies store={store} />
          {shouldShowCapacity() && <VaultCapacity store={store} />}
        </div>
      ) : (
        <CharacterStats
          destinyVersion={store.destinyVersion}
          stats={store.stats}
          storeId={store.id}
        />
      )}
    </div>
  );
}
