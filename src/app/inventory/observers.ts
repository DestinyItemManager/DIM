import _ from 'lodash';
import { observeStore } from 'app/utils/redux-utils';
import { RootState } from 'app/store/types';
import { currentAccountSelector } from 'app/accounts/selectors';
import { set } from 'idb-keyval';

/**
 * Set up an observer on the store that'll save item infos to sync service (google drive).
 * We specifically watch the legacy state, not the new one.
 */
export const saveItemInfosOnStateChange = _.once(() => {
  // Sneak in another observer for saving new-items to IDB
  observeStore(
    (state: RootState) => state.inventory.newItems,
    _.debounce(async (_, newItems, rootState) => {
      const account = currentAccountSelector(rootState);
      if (account) {
        const key = `newItems-m${account.membershipId}-d${account.destinyVersion}`;
        try {
          return await set(key, newItems);
        } catch (e) {
          console.error("Couldn't save new items", e);
        }
      }
    }, 1000)
  );
});
