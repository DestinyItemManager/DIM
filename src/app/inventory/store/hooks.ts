import { DestinyAccount } from 'app/accounts/destiny-account';
import { getSetBonusStatus } from 'app/item-popup/SetBonus';
import { useD2Definitions } from 'app/manifest/selectors';
import { refresh$ } from 'app/shell/refresh-events';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { itemMoved } from '../actions';
import { CrossTabMessage, useCrossTabUpdates } from '../cross-tab';
import { loadStores as d1LoadStores } from '../d1-stores';
import { loadStores as d2LoadStores } from '../d2-stores';
import { equippedItemsSelector, storesLoadedSelector } from '../selectors';

/**
 * A simple hook (probably too simple!) that loads and refreshes stores. This is
 * meant for use by top level pages. useDispatch() is cheap because it just
 * listens to a context that never changes.
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
    }, [account, dispatch]),
  );

  const { pathname } = useLocation();
  const onOptimizerPage = pathname.endsWith('/optimizer');
  const onMessage = useCallback(
    (msg: CrossTabMessage) => {
      switch (msg.type) {
        case 'stores-updated':
          // This is only implemented for D2
          if (account?.destinyVersion === 2 && !onOptimizerPage) {
            return dispatch(d2LoadStores({ fromOtherTab: true }));
          }
          break;
        case 'item-moved':
          if (account?.destinyVersion === 2) {
            dispatch(itemMoved(msg));
          }
          break;
      }
    },
    [account?.destinyVersion, dispatch, onOptimizerPage],
  );
  useCrossTabUpdates(onMessage);

  return loaded;
}

export function useCurrentSetBonus(storeId: string) {
  const equippedItems = useSelector(equippedItemsSelector(storeId));
  const defs = useD2Definitions()!;
  return useMemo(() => getSetBonusStatus(defs, equippedItems), [equippedItems, defs]);
}
