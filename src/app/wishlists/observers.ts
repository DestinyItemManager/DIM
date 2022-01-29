import { set } from 'app/storage/idb-keyval';
import { observeStore } from 'app/utils/redux-utils';

export function saveWishListToIndexedDB() {
  return observeStore(
    (state) => state.wishLists,
    (_prev, nextState) => {
      if (nextState.loaded) {
        set('wishlist', {
          wishListAndInfo: nextState.wishListAndInfo,
          lastFetched: nextState.lastFetched,
        });
      }
    }
  );
}
