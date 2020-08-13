import React from 'react';
import { connect } from 'react-redux';
import clsx from 'clsx';
import type { RootState } from 'app/store/reducers';
import type { DimStore, DimVault } from 'app/inventory/store-types';
import CharacterStats from '../store-stats/CharacterStats';
import AccountCurrencies from './AccountCurrencies';
import VaultCapacity from './VaultCapacity';
import styles from './StoreStats.m.scss';

interface StoreProps {
  isPhonePortrait: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

function isVault(store: DimStore): store is DimVault {
  return store.isVault;
}

function shouldShowCapacity(isPhonePortrait: boolean) {
  if (!isPhonePortrait) {
    return true;
  }
  return !$featureFlags.unstickyStats;
}

/** Render the store stats for any store type (character or vault) */
export default connect<StoreProps>(mapStateToProps)(function StoreStats({
  store,
  isPhonePortrait,
  style,
}: {
  store: DimStore;
  style?: React.CSSProperties;
} & StoreProps) {
  return (
    <div className={clsx({ ['store-cell']: Boolean(style), vault: store.isVault })} style={style}>
      {isVault(store) ? (
        <div className={styles.vaultStats}>
          <AccountCurrencies store={store} />
          {shouldShowCapacity(isPhonePortrait) && <VaultCapacity store={store} />}
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
});
