import { DestinyAccount } from 'app/accounts/destiny-account';
import { settingsSelector } from 'app/dim-api/selectors';
import { isPhonePortraitSelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import React from 'react';
import { connect } from 'react-redux';
import DesktopStores from './DesktopStores';
import { InventoryBuckets } from './inventory-buckets';
import PhoneStores from './PhoneStores';
import { bucketsSelector, sortedStoresSelector } from './selectors';
import { DimStore } from './store-types';
import './Stores.scss';

interface StoreProps {
  stores: DimStore[];
  isPhonePortrait: boolean;
  buckets: InventoryBuckets;
  singleCharacter: boolean;
  activeMode: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  const stores = sortedStoresSelector(state);
  const { singleCharacter, activeMode } = settingsSelector(state);
  return {
    stores,
    buckets: bucketsSelector(state)!,
    isPhonePortrait: isPhonePortraitSelector(state),
    singleCharacter: stores.length > 2 && singleCharacter,
    activeMode,
  };
}

type Props = {
  account: DestinyAccount;
} & StoreProps;

/**
 * Display inventory and character headers for all characters and the vault.
 */
function Stores({ account, stores, buckets, isPhonePortrait, singleCharacter, activeMode }: Props) {
  if (!stores.length || !buckets) {
    return null;
  }

  return isPhonePortrait ? (
    <PhoneStores stores={stores} buckets={buckets} singleCharacter={singleCharacter} />
  ) : (
    <DesktopStores
      account={account}
      stores={stores}
      buckets={buckets}
      singleCharacter={singleCharacter}
      activeMode={activeMode}
    />
  );
}

export default connect<StoreProps>(mapStateToProps)(Stores);
