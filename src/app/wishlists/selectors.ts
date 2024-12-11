import { DimItem } from 'app/inventory/item-types';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { createSelector } from 'reselect';
import { getInventoryWishListRoll, InventoryWishListRoll } from './wishlists';

export const wishListsSelector = (state: RootState) => state.wishLists;

export const wishListsLastFetchedSelector = (state: RootState) =>
  wishListsSelector(state).lastFetched;

export const wishListsByHashSelector = createSelector(wishListsSelector, (wls) =>
  Map.groupBy(wls.wishListAndInfo.wishListRolls?.filter(Boolean), (r) => r.itemHash),
);

export const wishListRollsForItemHashSelector = (itemHash: number) => (state: RootState) =>
  wishListsByHashSelector(state).get(itemHash) ?? emptyArray();

export const hasWishListSelector = createSelector(
  wishListsByHashSelector,
  (wishlists) => wishlists.size > 0,
);

/** Returns a memoized function to look up wishlist by item, which is reset when the wishlist changes. Prefer wishListSelector */
export const wishListFunctionSelector = createSelector(
  wishListsByHashSelector,
  (wishlists): ((item: DimItem) => InventoryWishListRoll | undefined) => {
    // Cache of inventory item id to roll. For this to work, make sure vendor/collections rolls have unique ids.
    const cache = new Map<string, InventoryWishListRoll | null>();
    return (item: DimItem) => {
      if (
        !($featureFlags.wishLists && wishlists && item.wishListEnabled) ||
        !item.sockets ||
        item.sockets.fromDefinitions
      ) {
        return undefined;
      }
      const cachedRoll = cache.get(item.id);
      if (cachedRoll !== undefined) {
        return cachedRoll || undefined;
      }
      const roll = getInventoryWishListRoll(item, wishlists);
      cache.set(item.id, roll ?? null);
      return roll;
    };
  },
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
