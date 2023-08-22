import { storeObject } from 'app/storage/object-store';
import { observeStore } from 'app/utils/redux-utils';

export function saveWishListToIndexedDB() {
  return observeStore(
    (state) => state.wishLists,
    (_prev, nextState) => {
      if (nextState.loaded) {
        storeObject('wishlist', {
          wishListAndInfo: nextState.wishListAndInfo,
          lastFetched: nextState.lastFetched,
        });
      }
    }
  );
}
