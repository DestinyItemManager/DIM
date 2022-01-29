import type { DimStore } from 'app/inventory-stores/store-types';
import { useIsPhonePortrait } from 'app/shell/selectors';
import clsx from 'clsx';
import React from 'react';
import { LoadoutStats, PowerFormula } from '../store-stats/CharacterStats';
import AccountCurrencies from './AccountCurrencies';
import D1CharacterStats from './D1CharacterStats';
import styles from './StoreStats.m.scss';
import VaultCapacity from './VaultCapacity';

/** Render the store stats for any store type (character or vault) */
export default function StoreStats({
  store,
  style,
}: {
  store: DimStore;
  style?: React.CSSProperties;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  return (
    <div className={clsx({ ['store-cell']: Boolean(style), vault: store.isVault })} style={style}>
      {store.isVault ? (
        <div className={styles.vaultStats}>
          <AccountCurrencies />
          {!isPhonePortrait && <VaultCapacity />}
        </div>
      ) : store.destinyVersion === 1 ? (
        <D1CharacterStats stats={store.stats} />
      ) : (
        <div className="stat-bars destiny2">
          <PowerFormula stats={store.stats} storeId={store.id} />
          <LoadoutStats stats={store.stats} storeId={store.id} characterClass={store.classType} />
        </div>
      )}
    </div>
  );
}
