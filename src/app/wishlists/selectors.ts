import { DimItem } from 'app/inventory/item-types';
import { RootState } from 'app/store/types';
import { weakMemoize } from 'app/utils/util';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { getInventoryWishListRoll, InventoryWishListRoll } from './wishlists';

export const wishListsSelector = (state: RootState) => state.wishLists;

export const wishListsLastFetchedSelector = (state: RootState) =>
  wishListsSelector(state).lastFetched;

export const wishListsByHashSelector = createSelector(wishListsSelector, (wls) =>
  _.groupBy(wls.wishListAndInfo.wishListRolls?.filter(Boolean), (r) => r.itemHash)
);

export const hasWishListSelector = createSelector(
  wishListsByHashSelector,
  (wishlists) => !_.isEmpty(wishlists)
);

/** Returns a memoized function to look up wishlist by item, which is reset when the wishlist changes. Prefer wishListSelector */
export const wishListFunctionSelector = createSelector(wishListsByHashSelector, (wishlists): ((
  item: DimItem
) => InventoryWishListRoll | undefined) =>
  weakMemoize((item: DimItem) => getInventoryWishListRoll(item, wishlists))
);

/**
 * A reverse-curried selector that is easier to use in useSelector. This will re-render the component only when
 * this item's wishlist state changes.
 *
 * @example
 *
 * useSelector(wishListSelector(item))
 */
export const wishListSelector = (item: DimItem) => (state: RootState) =>
  wishListFunctionSelector(state)(item);
