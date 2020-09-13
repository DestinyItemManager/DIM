import { DestinyAccount } from 'app/accounts/destiny-account';
import { refresh$ } from 'app/shell/refresh';
import { useSubscription } from 'app/utils/hooks';
import { useEffect } from 'react';
import { queueAction } from '../action-queue';
import { D1StoresService } from '../d1-stores';
import { D2StoresService } from '../d2-stores';

/**
 * A simple hook (probably too simple!) that loads and refreshes stores. This is
 * meant for use by top level pages. It could have used useSubscription to be
 * extra cool, but I'm trying to avoid having both useSubscription and connect()
 * in the same component. useDispatch() is cheap because it just listens to a
 * context that never changes.
 */
export function useLoadStores(account: DestinyAccount | undefined, loaded: boolean) {
  useEffect(() => {
    if (account && !loaded) {
      account.destinyVersion === 2
        ? D2StoresService.getStoresStream(account)
        : D1StoresService.getStoresStream(account);
    }
  }, [account, loaded]);

  useSubscription(() =>
    refresh$.subscribe(() => {
      if (account) {
        queueAction<any>(() =>
          account.destinyVersion === 2
            ? D2StoresService.reloadStores()
            : D1StoresService.reloadStores()
        );
      }
    })
  );
}
