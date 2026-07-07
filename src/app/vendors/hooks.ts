import { DestinyAccount } from 'app/accounts/destiny-account';
import { loadingTracker } from 'app/shell/loading-tracker';
import { refresh$ } from 'app/shell/refresh-events';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { useCallback, useEffect, useState } from 'react';
import { loadAllVendors } from './actions';

/**
 * Loads all vendors for the given account+character, and tries refreshing them
 * when the app refreshes.
 *
 * Returns whether the initial load is still running (including the follow-up
 * per-vendor item component fetches). Refreshes don't re-enter the loading
 * state, since existing vendor data stays usable while it updates.
 */
export function useLoadVendors(
  account: DestinyAccount,
  storeId: string | undefined,
  active = true,
): boolean {
  const dispatch = useThunkDispatch();
  const [loading, setLoading] = useState(Boolean(storeId && active));
  useEffect(() => {
    if (storeId && active) {
      let live = true;
      setLoading(true);
      const promise = dispatch(loadAllVendors(account, storeId)).finally(() => {
        if (live) {
          setLoading(false);
        }
      });
      loadingTracker.addPromise(promise);
      return () => {
        live = false;
      };
    } else {
      setLoading(false);
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

  return loading;
}
