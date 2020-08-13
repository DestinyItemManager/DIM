import { observeStore } from 'app/utils/redux-utils';
import { set } from 'idb-keyval';

export function saveWishListToIndexedDB() {
  return observeStore(
    (state) => state.wishLists,
    (_, nextState) => {
      if (nextState.loaded) {
        set('wishlist', {
          wishListAndInfo: nextState.wishListAndInfo,
          lastFetched: nextState.lastFetched,
        });
      }
    }
  );
}
