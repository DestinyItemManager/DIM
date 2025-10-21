import type { DimStore } from 'app/inventory/store-types';
import { useCurrentSetBonus } from 'app/inventory/store/hooks';
import { SetBonusesStatus } from 'app/item-popup/SetBonus';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { PowerFormula, StoreCharacterStats } from '../store-stats/CharacterStats';
import AccountCurrencies from './AccountCurrencies';
import { D1StoreCharacterStats } from './D1CharacterStats';
import * as styles from './StoreStats.m.scss';
import VaultCapacity from './VaultCapacity';

/** Render the store stats for any store type (character or vault) */
export default function StoreStats({ store }: { store: DimStore }) {
  const isPhonePortrait = useIsPhonePortrait();
  const setBonusStatus = useCurrentSetBonus(store.id);
  return store.isVault ? (
    <div className={styles.vaultStats}>
      <AccountCurrencies />
      {!isPhonePortrait && <VaultCapacity />}
    </div>
  ) : store.destinyVersion === 1 ? (
    <D1StoreCharacterStats store={store} />
  ) : (
    <div className={styles.characterStats}>
      <div className={styles.topRow}>
        <PowerFormula storeId={store.id} />
        <div className={styles.setBonuses}>
          <SetBonusesStatus setBonusStatus={setBonusStatus} store={store} />
        </div>
      </div>
      <StoreCharacterStats store={store} />
    </div>
  );
}
