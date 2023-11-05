import { set } from 'app/storage/idb-keyval';
import { observeStore } from 'app/utils/redux';

export function saveAccountsToIndexedDB() {
  return observeStore(
    (state) => state.accounts,
    (currentState, nextState) => {
      if (nextState.loaded && nextState.accounts !== currentState.accounts) {
        set('accounts', nextState.accounts);
      }
    },
  );
}
