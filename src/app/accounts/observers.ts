import { storeObject } from 'app/storage/object-store';
import { observeStore } from 'app/utils/redux-utils';

export function saveAccountsToIndexedDB() {
  return observeStore(
    (state) => state.accounts,
    (currentState, nextState) => {
      if (nextState.loaded && nextState.accounts !== currentState.accounts) {
        storeObject('accounts', nextState.accounts);
      }
    }
  );
}
