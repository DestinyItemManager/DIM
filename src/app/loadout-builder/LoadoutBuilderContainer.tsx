import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import { RootState } from 'app/store/types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { RouteComponentProps, withRouter, StaticContext } from 'react-router';
import { Loadout } from 'app/loadout/loadout-types';
import LoadoutBuilder from './LoadoutBuilder';
import { Location } from 'history';

interface ProvidedProps {
  account: DestinyAccount;
  location: Location<{
    loadout?: Loadout | undefined;
  }>;
}

interface StoreProps {
  defs?: D2ManifestDefinitions;
}

type Props = ProvidedProps &
  StoreProps &
  RouteComponentProps<{}, StaticContext, { loadout?: Loadout }>;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs: state.manifest.d2Manifest,
  });
}

/**
 * The Loadout Optimizer screen
 * TODO This isn't really a container but I can't think of a better name. It's more like
 * a LoadoutBuilderEnsureStuffIsLoaded
 */
function LoadoutBuilderContainer({ account, defs, location }: Props) {
  if (!defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <LoadoutBuilder account={account} defs={defs} preloadedLoadout={location.state?.loadout} />
  );
}

export default withRouter(connect<StoreProps>(mapStateToProps)(LoadoutBuilderContainer));
