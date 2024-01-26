import { set } from 'app/storage/idb-keyval';
import { StoreObserver } from 'app/store/observerMiddleware';
import { WishListsState } from './reducer';

export function createWishlistObserver(): StoreObserver<WishListsState> {
  return {
    id: 'wish-list-observer',
    getObserved: (rootState) => rootState.wishLists,
    sideEffect: ({ current }) => {
      if (current.loaded) {
        set('wishlist', {
          wishListAndInfo: current.wishListAndInfo,
          lastFetched: current.lastFetched,
        });
      }
    },
  };
}
