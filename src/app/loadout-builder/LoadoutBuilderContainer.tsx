import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { Loadout } from 'app/loadout/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { Location } from 'history';
import React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, StaticContext, withRouter } from 'react-router';
import { DestinyAccount } from '../accounts/destiny-account';
import { sortedStoresSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import LoadoutBuilder from './LoadoutBuilder';

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
    defs: d2ManifestSelector(state),
  });
}

/**
 * The Loadout Optimizer screen
 * TODO This isn't really a container but I can't think of a better name. It's more like
 * a LoadoutBuilderEnsureStuffIsLoaded
 */
function LoadoutBuilderContainer({ account, stores, defs, location }: Props) {
  useLoadStores(account, stores.length > 0);

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
