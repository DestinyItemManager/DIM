import { allItemsSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { getInventoryWishListRolls } from './wishlists';

export const wishListsSelector = (state: RootState) => state.wishLists;

export const wishListsLastFetchedSelector = (state: RootState) =>
  wishListsSelector(state).lastFetched;

const wishListsByHashSelector = createSelector(wishListsSelector, (wls) =>
  _.groupBy(wls.wishListAndInfo.wishListRolls?.filter(Boolean), (r) => r.itemHash)
);

export const wishListsEnabledSelector = (state: RootState) =>
  (wishListsSelector(state)?.wishListAndInfo?.wishListRolls?.length || 0) > 0;

export const inventoryWishListsSelector = createSelector(
  allItemsSelector,
  wishListsByHashSelector,
  getInventoryWishListRolls
);
