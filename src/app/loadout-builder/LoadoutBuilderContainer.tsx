import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { setSearchQuery } from 'app/shell/actions';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { DestinyAccount } from '../accounts/destiny-account';
import { savedLoadoutParametersSelector } from '../dim-api/selectors';
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
  const location = useLocation();
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions();
  const stores = useSelector(sortedStoresSelector);
  useLoadStores(account);

  const savedLoadoutParameters = useSelector(savedLoadoutParametersSelector);

  const searchParams = new URLSearchParams(location.search);
  const urlClassTypeString = searchParams.get('class');
  const urlLoadoutParametersJSON = searchParams.get('p');

  const urlClassType = urlClassTypeString ? parseInt(urlClassTypeString) : undefined;

  let urlLoadoutParameters: LoadoutParameters | undefined;
  if (urlLoadoutParametersJSON) {
    urlLoadoutParameters = JSON.parse(urlLoadoutParametersJSON);
    if (urlLoadoutParameters?.query) {
      dispatch(setSearchQuery(urlLoadoutParameters.query));
    }
  }

  if (!stores || !stores.length || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const preloadedLoadout = location.state?.loadout as Loadout | undefined;
  if (preloadedLoadout?.parameters?.query) {
    dispatch(setSearchQuery(preloadedLoadout.parameters.query));
  }

  // TODO: key off the URL params?
  return (
    <LoadoutBuilder
      stores={stores}
      preloadedLoadout={preloadedLoadout}
      initialClassType={urlClassType}
      initialLoadoutParameters={urlLoadoutParameters || savedLoadoutParameters}
    />
  );
}
