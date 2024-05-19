import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { Loadout } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import ErrorPanel from 'app/shell/ErrorPanel';
import { setSearchQuery } from 'app/shell/actions';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { usePageTitle } from 'app/utils/hooks';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { createSelector } from 'reselect';
import { DestinyAccount } from '../accounts/destiny-account';
import { allItemsSelector } from '../inventory/selectors';
import LoadoutBuilder from './LoadoutBuilder';
import { ResolvedStatConstraint } from './types';

const disabledDueToMaintenanceSelector = createSelector(
  allItemsSelector,
  (items) => items.length > 0 && items.every((item) => item.missingSockets || !item.sockets),
);

/**
 * The entry point for the Loadout Optimizer screen. This is responsible for
 * making sure things are loading and reading initial loadout optimizer state
 * from URL parameters. It then delegates to LoadoutBuilder which does most of
 * the work.
 */
export default function LoadoutBuilderContainer({ account }: { account: DestinyAccount }) {
  usePageTitle(t('LB.LB'));
  const location = useLocation();
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions();
  const disabledDueToMaintenance = useSelector(disabledDueToMaintenanceSelector);
  const storesLoaded = useLoadStores(account);

  let query: string | undefined;

  // Get an entire loadout from state - this is used when optimizing a loadout from within DIM.
  const locationState = location.state as
    | {
        loadout: Loadout | undefined;
        storeId: string | undefined;
        strictUpgradeStatConstraints: ResolvedStatConstraint[] | undefined;
      }
    | undefined;
  const preloadedLoadout = locationState?.loadout;
  if (preloadedLoadout?.parameters?.query) {
    query = preloadedLoadout.parameters.query;
  }

  const storeId = locationState?.storeId;

  // Apply the preloaded loadout's query to the main search bar
  useEffect(() => {
    if (query) {
      dispatch(setSearchQuery(query));
    }
  }, [dispatch, query]);

  if (!storesLoaded || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  // Don't even bother showing the tool when Bungie has shut off sockets.
  if (disabledDueToMaintenance) {
    return (
      <div className="dim-page">
        <ErrorPanel title={t('LoadoutBuilder.DisabledDueToMaintenance')} showSocials />
      </div>
    );
  }

  return (
    <LoadoutBuilder
      key={preloadedLoadout?.id ?? storeId ?? 'lo'}
      preloadedLoadout={preloadedLoadout}
      preloadedStrictStatConstraints={locationState?.strictUpgradeStatConstraints}
      storeId={storeId}
    />
  );
}
