import React from 'react';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { useLoadStores } from 'app/utils/hooks';
import ShowPageLoading from './ShowPageLoading';
import { t } from 'app/i18next-t';

interface Props {
  account: DestinyAccount;
  children?: React.ReactNode;
}

/** Shows a loading screen while stores are loaded, then renders content */
export default function StoresLoader({ account, children }: Props) {
  const storesLoaded = useLoadStores(account);

  return !storesLoaded ? <ShowPageLoading message={t('Loading.Profile')} /> : <>{children}</>;
}
