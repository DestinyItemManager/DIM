import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { DestinyAccount } from '../accounts/destiny-account';
import { sortedStoresSelector } from '../inventory/selectors';
import LoadoutBuilder from './LoadoutBuilder';

interface Props {
  account: DestinyAccount;
}

/**
 * The Loadout Optimizer screen
 * TODO This isn't really a container but I can't think of a better name. It's more like
 * a LoadoutBuilderEnsureStuffIsLoaded
 */
export default function LoadoutBuilderContainer({ account }: Props) {
  const location = useLocation<{
    loadout?: Loadout | undefined;
  }>();
  const defs = useD2Definitions();
  const stores = useSelector(sortedStoresSelector);
  useLoadStores(account, stores.length > 0);

  if (!stores || !stores.length || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return <LoadoutBuilder stores={stores} preloadedLoadout={location.state?.loadout} />;
}
