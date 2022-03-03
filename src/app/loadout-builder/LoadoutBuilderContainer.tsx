import { defaultLoadoutParameters, LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { savedLoadoutParametersSelector } from 'app/dim-api/selectors';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { Loadout } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { setSearchQuery } from 'app/shell/actions';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
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
  const urlNotes = searchParams.get('n');

  const urlClassType = urlClassTypeString ? parseInt(urlClassTypeString) : undefined;

  let query = '';
  let urlLoadoutParameters: LoadoutParameters | undefined;
  if (urlLoadoutParametersJSON) {
    urlLoadoutParameters = JSON.parse(urlLoadoutParametersJSON);
    urlLoadoutParameters = { ...defaultLoadoutParameters, ...urlLoadoutParameters };
    if (urlLoadoutParameters?.query) {
      query = urlLoadoutParameters.query;
    }
  }

  const preloadedLoadout = (location.state as { loadout: Loadout } | undefined)?.loadout;
  if (preloadedLoadout?.parameters?.query) {
    query = preloadedLoadout.parameters.query;
  }

  useEffect(() => {
    if (query) {
      dispatch(setSearchQuery(query));
    }
  }, [dispatch, query]);

  if (!stores || !stores.length || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  // TODO: key off the URL params?
  return (
    <LoadoutBuilder
      account={account}
      stores={stores}
      preloadedLoadout={preloadedLoadout}
      initialClassType={urlClassType}
      notes={urlNotes ?? preloadedLoadout?.notes}
      initialLoadoutParameters={urlLoadoutParameters || savedLoadoutParameters}
    />
  );
}
