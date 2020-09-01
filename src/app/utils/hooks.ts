import { useEffect, useState } from 'react';
import { Subscription } from 'rxjs';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { D1StoresService } from 'app/inventory/d1-stores';
import { D2StoresService } from 'app/inventory/d2-stores';
import { refresh$ } from 'app/shell/refresh';
import { queueAction } from 'app/inventory/action-queue';
import { useSelector } from 'react-redux';
import { storesLoadedSelector } from 'app/inventory/selectors';

/**
 * Subscribe to an Observable, unsubscribing on changes. Use
 * useCallback on the subscribeFn to prevent it changing on every
 * render.
 */
export function useSubscription(subscribeFn: () => Subscription) {
  useEffect(() => {
    const subscription = subscribeFn();
    return () => subscription.unsubscribe();
  }, [subscribeFn]);
}

/**
 * Returns whether the shift key is held down (ignores focus)
 */
export function useShiftHeld() {
  const [shiftHeld, setShiftHeld] = useState(false);
  useEffect(() => {
    const shiftTrue = (e) => {
      e.shiftKey && setShiftHeld(true);
    };
    const shiftFalse = (e) => {
      !e.shiftKey && setShiftHeld(false);
    };
    document.addEventListener('keydown', shiftTrue);
    document.addEventListener('keyup', shiftFalse);
    return () => {
      document.removeEventListener('keydown', shiftTrue);
      document.removeEventListener('keyup', shiftFalse);
    };
  }, []);

  return shiftHeld;
}

function getStoresService(account: DestinyAccount) {
  return account.destinyVersion === 1 ? D1StoresService : D2StoresService;
}

export function useLoadStores(account: DestinyAccount) {
  const storesLoaded = useSelector(storesLoadedSelector);

  useSubscription(() => {
    const storesService = getStoresService(account);
    return refresh$.subscribe(() => queueAction(() => storesService.reloadStores()));
  });

  useEffect(() => {
    const storesService = getStoresService(account);
    if (!storesLoaded) {
      // TODO: Dispatch an action to load stores instead
      storesService.getStoresStream(account);
    }
  }, [account, storesLoaded]);

  return storesLoaded;
}
