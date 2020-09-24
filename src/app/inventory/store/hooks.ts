import { DestinyAccount } from 'app/accounts/destiny-account';
import { refresh$ } from 'app/shell/refresh';
import { ThunkDispatchProp } from 'app/store/types';
import { useSubscription } from 'app/utils/hooks';
import { DestinyComponentType } from 'bungie-api-ts/destiny2';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { queueAction } from '../action-queue';
import { loadStores as d1LoadStores } from '../d1-stores';
import { loadStores as d2LoadStores } from '../d2-stores';

/**
 * A simple hook (probably too simple!) that loads and refreshes stores. This is
 * meant for use by top level pages. It could have used useSubscription to be
 * extra cool, but I'm trying to avoid having both useSubscription and connect()
 * in the same component. useDispatch() is cheap because it just listens to a
 * context that never changes.
 */
export function useLoadStores(
  account: DestinyAccount | undefined,
  loaded: boolean,
  components?: DestinyComponentType[]
) {
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  useEffect(() => {
    if (account && !loaded) {
      if (account?.destinyVersion == 2) {
        dispatch(d2LoadStores(components));
      } else {
        dispatch(d1LoadStores());
      }
    }
  }, [account, dispatch, components, loaded]);

  useSubscription(() =>
    refresh$.subscribe(() => {
      if (account) {
        queueAction<any>(() => {
          if (account?.destinyVersion == 2) {
            return dispatch(d2LoadStores());
          } else {
            return dispatch(d1LoadStores());
          }
        });
      }
    })
  );
}
