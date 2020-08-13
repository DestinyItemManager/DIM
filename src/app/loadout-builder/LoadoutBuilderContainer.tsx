import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2StoresService } from '../inventory/d2-stores';
import { DimStore } from '../inventory/store-types';
import { RootState } from 'app/store/types';
import { sortedStoresSelector } from '../inventory/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { refresh$ } from 'app/shell/refresh';
import { queueAction } from 'app/inventory/action-queue';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { RouteComponentProps, withRouter, StaticContext } from 'react-router';
import { Loadout } from 'app/loadout/loadout-types';
import { useSubscription } from 'app/utils/hooks';
import LoadoutBuilder from './LoadoutBuilder';
import { Location } from 'history';

interface ProvidedProps {
  account: DestinyAccount;
  location: Location<{
    loadout?: Loadout | undefined;
  }>;
}

interface StoreProps {
  stores: DimStore[];
  defs?: D2ManifestDefinitions;
}

type Props = ProvidedProps &
  StoreProps &
  RouteComponentProps<{}, StaticContext, { loadout?: Loadout }>;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    stores: sortedStoresSelector(state),
    defs: state.manifest.d2Manifest,
  });
}

/**
 * The Loadout Optimizer screen
 * TODO This isn't really a container but I can't think of a better name. It's more like
 * a LoadoutBuilderEnsureStuffIsLoaded
 */
function LoadoutBuilderContainer({ account, stores, defs, location }: Props) {
  useSubscription(
    useCallback(
      () =>
        D2StoresService.getStoresStream(account).subscribe((stores) => {
          if (!stores || !stores.length) {
            return;
          }
        }),
      [account]
    )
  );

  useSubscription(
    useCallback(
      () => refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores())),
      []
    )
  );

  if (!stores || !stores.length || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <LoadoutBuilder
      account={account}
      stores={stores}
      defs={defs}
      preloadedLoadout={location.state?.loadout}
    />
  );
}

export default withRouter(connect<StoreProps>(mapStateToProps)(LoadoutBuilderContainer));
