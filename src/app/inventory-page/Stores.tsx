import { settingSelector } from 'app/dim-api/selectors';
import { bucketsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import React from 'react';
import { useSelector } from 'react-redux';
import PhoneStores from '../inventory-page/PhoneStores';
import DesktopStores from './DesktopStores';

/**
 * Display inventory and character headers for all characters and the vault.
 */
export default function Stores() {
  const stores = useSelector(sortedStoresSelector);
  const buckets = useSelector(bucketsSelector);
  const singleCharacterSetting = useSelector(settingSelector('singleCharacter'));
  const singleCharacter = stores.length > 2 && singleCharacterSetting;
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
