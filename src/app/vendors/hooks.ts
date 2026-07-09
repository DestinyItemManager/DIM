import { DestinyAccount } from 'app/accounts/destiny-account';
import { loadingTracker } from 'app/shell/loading-tracker';
import { refresh$ } from 'app/shell/refresh-events';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { useEventBusListener } from 'app/utils/hooks';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { loadAllVendors } from './actions';

/**
 * Loads all vendors for the given account+character, and tries refreshing them
 * when the app refreshes.
 *
 * Returns whether the initial load is still settling (including the follow-up
 * per-vendor item component fetches). Refreshes don't re-enter the loading
 * state, since existing vendor data stays usable while it updates.
 */
export function useLoadVendors(
  account: DestinyAccount,
  storeId: string | undefined,
  active = true,
): boolean {
  const dispatch = useThunkDispatch();
  useEffect(() => {
    if (storeId && active) {
      loadingTracker.addPromise(dispatch(loadAllVendors(account, storeId)));
    }
  }, [account, storeId, dispatch, active]);

  useEventBusListener(
    refresh$,
    useCallback(() => {
      if (storeId && active) {
        loadingTracker.addPromise(dispatch(loadAllVendors(account, storeId, true)));
      }
    }, [account, active, dispatch, storeId]),
  );

  const fullyLoaded = useSelector((state: RootState) =>
    storeId ? Boolean(state.vendors.vendorsByCharacter[storeId]?.fullyLoaded) : false,
  );
  return Boolean(storeId && active) && !fullyLoaded;
}
