import { observeStore } from 'app/utils/redux-utils';
import { set } from 'idb-keyval';

export function saveVendorDropsToIndexedDB() {
  return observeStore(
    (state) => state.vendorDrops,
    (_, nextState) => {
      if (nextState.loaded) {
        set('vendorengrams', nextState);
      }
    }
  );
}
