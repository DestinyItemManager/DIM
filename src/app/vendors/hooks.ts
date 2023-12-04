import { DestinyAccount } from 'app/accounts/destiny-account';
import { loadingTracker } from 'app/shell/loading-tracker';
import { refresh$ } from 'app/shell/refresh-events';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { useCallback, useEffect } from 'react';
import { loadAllVendors } from './actions';

/**
 * Loads all vendors for the given account+character, and tries refreshing them
 * when the app refreshes.
 */
export function useLoadVendors(
  account: DestinyAccount,
  storeId: string | undefined,
  active = true,
) {
  const dispatch = useThunkDispatch();
  useEffect(() => {
    if (storeId && active) {
      dispatch(loadAllVendors(account, storeId));
    }
  }, [account, storeId, dispatch, active]);

  useEventBusListener(
    refresh$,
    useCallback(
      () => () => {
        if (storeId && active) {
          loadingTracker.addPromise(dispatch(loadAllVendors(account, storeId, true)));
        }
      },
      [account, active, dispatch, storeId],
    ),
  );
}
