import { currentAccountSelector } from 'app/accounts/selectors';
import { set } from 'app/storage/idb-keyval';
import { StoreObserver } from 'app/store/observerMiddleware';
import { errorLog } from 'app/utils/log';
import { debounce } from 'es-toolkit';
import { shallowEqual } from 'fast-equals';
import { newItemsSelector } from './selectors';

interface SaveInfosObservedState {
  key: string | undefined;
  newItems: Set<string>;
}

/**
 * Set up an observer on the store that'll save item infos to IndexedDB.
 */
export function createSaveItemInfosObserver(): StoreObserver<SaveInfosObservedState> {
  return {
    id: 'save-item-infos-observer',
    equals: shallowEqual,
    getObserved: (rootState) => {
      const account = currentAccountSelector(rootState);
      return {
        key: account && `newItems-m${account.membershipId}-d${account.destinyVersion}`,
        newItems: newItemsSelector(rootState),
      };
    },
    sideEffect: debounce(async ({ current }: { current: SaveInfosObservedState }) => {
      if (current.key) {
        try {
          return await set(current.key, current.newItems);
        } catch (e) {
          errorLog('new-items', "Couldn't save new items", e);
        }
      }
    }, 1000),
  };
}
