import { currentAccountSelector } from 'app/accounts/selectors';
import { set } from 'app/storage/idb-keyval';
import { RootState } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux-utils';
import _ from 'lodash';
import { newItemsSelector } from './selectors';

/**
 * Set up an observer on the store that'll save item infos to sync service (google drive).
 * We specifically watch the legacy state, not the new one.
 */
export const saveItemInfosOnStateChange = _.once(() => {
  // Sneak in another observer for saving new-items to IDB
  observeStore(
    newItemsSelector,
    _.debounce(async (_prev, newItems: Set<string>, rootState: RootState) => {
      const account = currentAccountSelector(rootState);
      if (account) {
        const key = `newItems-m${account.membershipId}-d${account.destinyVersion}`;
        try {
          return await set(key, newItems);
        } catch (e) {
          errorLog('new-items', "Couldn't save new items", e);
        }
      }
    }, 1000)
  );
});
