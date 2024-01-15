import { set } from 'app/storage/idb-keyval';
import { StoreObserver } from 'app/store/observerMiddleware';
import { shallowEqual } from 'fast-equals';
import { AccountsState } from './reducer';

export function createSaveAccountsObserver(): StoreObserver<
  Pick<AccountsState, 'loaded' | 'accounts'>
> {
  return {
    id: 'save-accounts-observer',
    equals: shallowEqual,
    getObserved: (rootState) => ({
      loaded: rootState.accounts.loaded,
      accounts: rootState.accounts.accounts,
    }),
    sideEffect: ({ current }) => {
      if (current.loaded) {
        set('accounts', current.accounts);
      }
    },
  };
}
