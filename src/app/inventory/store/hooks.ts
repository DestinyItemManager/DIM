import { DestinyAccount } from 'app/accounts/destiny-account';
import { refresh$ } from 'app/shell/refresh-events';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { loadStores as d1LoadStores } from '../d1-stores';
import { loadStores as d2LoadStores } from '../d2-stores';
import { storesLoadedSelector } from '../selectors';

/**
 * A simple hook (probably too simple!) that loads and refreshes stores. This is
 * meant for use by top level pages. It could have used useSubscription to be
 * extra cool, but I'm trying to avoid having both useSubscription and connect()
 * in the same component. useDispatch() is cheap because it just listens to a
 * context that never changes.
 */
export function useLoadStores(account: DestinyAccount | undefined) {
  const dispatch = useThunkDispatch();
  const loaded = useSelector(storesLoadedSelector);

  useEffect(() => {
    if (account && !loaded) {
      if (account?.destinyVersion === 2) {
        dispatch(d2LoadStores());
      } else {
        dispatch(d1LoadStores());
      }
    }
  }, [account, dispatch, loaded]);

  useEventBusListener(
    refresh$,
    useCallback(() => {
      if (account) {
        if (account?.destinyVersion === 2) {
          return dispatch(d2LoadStores());
        } else {
          return dispatch(d1LoadStores());
        }
      }
    }, [account, dispatch])
  );

  return loaded;
}
