import type { DimStore } from 'app/inventory/store-types';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { PowerFormula, StoreCharacterStats } from '../store-stats/CharacterStats';
import AccountCurrencies from './AccountCurrencies';
import D1CharacterStats from './D1CharacterStats';
import styles from './StoreStats.m.scss';
import VaultCapacity from './VaultCapacity';

/** Render the store stats for any store type (character or vault) */
export default function StoreStats({ store }: { store: DimStore }) {
  const isPhonePortrait = useIsPhonePortrait();
  return store.isVault ? (
    <div className={styles.vaultStats}>
      <AccountCurrencies />
      {!isPhonePortrait && <VaultCapacity />}
    </div>
  ) : store.destinyVersion === 1 ? (
    <D1CharacterStats stats={store.stats} />
  ) : (
    <div className="stat-bars">
      <PowerFormula storeId={store.id} />
      <StoreCharacterStats store={store} />
    </div>
  );
}
