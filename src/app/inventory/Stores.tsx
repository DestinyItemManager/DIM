import { settingsSelector } from 'app/dim-api/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
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
  buckets: InventoryBuckets;
  singleCharacter: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  const stores = sortedStoresSelector(state);
  const { singleCharacter } = settingsSelector(state);
  return {
    stores,
    buckets: bucketsSelector(state)!,
    singleCharacter: stores.length > 2 && singleCharacter,
  };
}

type Props = StoreProps;

/**
 * Display inventory and character headers for all characters and the vault.
 */
function Stores({ stores, buckets, singleCharacter }: Props) {
  const isPhonePortrait = useIsPhonePortrait();
  if (!stores.length || !buckets) {
    return null;
  }

  return isPhonePortrait ? (
    <PhoneStores stores={stores} buckets={buckets} singleCharacter={singleCharacter} />
  ) : (
    <DesktopStores stores={stores} buckets={buckets} singleCharacter={singleCharacter} />
  );
}

export default connect<StoreProps>(mapStateToProps)(Stores);
