import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { decodeUrlLoadoutParameters } from 'app/loadout/loadout-share/loadout-import';
import { useD2Definitions } from 'app/manifest/selectors';
import { setSearchQuery } from 'app/shell/actions';
import ErrorPanel from 'app/shell/ErrorPanel';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { createSelector } from 'reselect';
import { DestinyAccount } from '../accounts/destiny-account';
import { allItemsSelector, sortedStoresSelector } from '../inventory/selectors';
import LoadoutBuilder from './LoadoutBuilder';

const disabledDueToMaintenanceSelector = createSelector(
  allItemsSelector,
  (items) => items.length > 0 && items.every((item) => item.missingSockets || !item.sockets)
);

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
  const disabledDueToMaintenance = useSelector(disabledDueToMaintenanceSelector);
  useLoadStores(account);

  const decodedParameters = decodeUrlLoadoutParameters(location.search);
  const {
    classType: urlClassType,
    notes: urlNotes,
    parameters: urlLoadoutParameters,
  } = decodedParameters;
  let query = decodedParameters.query;

  const preloadedLoadout = (location.state as { loadout: Loadout } | undefined)?.loadout;
  if (preloadedLoadout?.parameters?.query) {
    query = preloadedLoadout.parameters.query;
  }

  useEffect(() => {
    if (query) {
      dispatch(setSearchQuery(query));
    }
  }, [dispatch, query]);

  if (!stores?.length || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  // Don't even bother showing the tool when Bungie has shut off sockets.
  if (disabledDueToMaintenance) {
    return (
      <div className="dim-page">
        <ErrorPanel title={t('LoadoutBuilder.DisabledDueToMaintenance')} showTwitters />
      </div>
    );
  }

  // TODO: key off the URL params?
  return (
    <LoadoutBuilder
      account={account}
      stores={stores}
      preloadedLoadout={preloadedLoadout}
      initialClassType={urlClassType ?? preloadedLoadout?.classType}
      initialLoadoutParameters={urlLoadoutParameters || preloadedLoadout?.parameters}
      notes={urlNotes ?? preloadedLoadout?.notes}
    />
  );
}
