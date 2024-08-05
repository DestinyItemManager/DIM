import { DimItem } from 'app/inventory/item-types';
import { RootState } from 'app/store/types';
import Chance from 'chance';
import { getTestRootState, getTestWishListRoll } from 'testing/test-utils';
import {
  wishListRollsForItemHashSelector,
  wishListsByHashSelector,
  wishListsLastFetchedSelector,
  wishListsSelector,
} from './selectors';

const chance = Chance();

describe('wishlists selectors', () => {
  let expectedRootState: RootState;

  beforeEach(async () => {
    expectedRootState = await getTestRootState(chance);
  });
  describe('wishListsSelector', () => {
    it('should return wishlists from state', () => {
      const actualRootStateWishlists = wishListsSelector(expectedRootState);

      expect(actualRootStateWishlists).toEqual(expectedRootState.wishLists);
    });
  });

  describe('wishListsLastFetchedSelector', () => {
    it('should return the lastFetched date for the whishlists in state', () => {
      const actualWishlistsLastFetched = wishListsLastFetchedSelector(expectedRootState);
      expect(actualWishlistsLastFetched).toEqual(expectedRootState.wishLists.lastFetched);
    });
  });

  describe('wishListsByHashSelector', () => {
    it('should return a map of item hashes and wishlist rolls', () => {
      const expectedWishListRoll = getTestWishListRoll(chance);
      expectedRootState.wishLists.wishListAndInfo.wishListRolls = [
        ...expectedRootState.wishLists.wishListAndInfo.wishListRolls,
        expectedWishListRoll,
      ];
      const actualWishlistsByHash = wishListsByHashSelector(expectedRootState);
      expect(actualWishlistsByHash.get(expectedWishListRoll.itemHash)).toContain(
        expectedWishListRoll,
      );
    });

    it('should put wishlist rolls with the same hash under the same key', () => {
      const expectedItemHash = chance.natural();
      const expectedWishListRollOne = {
        ...getTestWishListRoll(chance),
        itemHash: expectedItemHash,
      };
      const expectedWishListRollTwo = {
        ...getTestWishListRoll(chance),
        itemHash: expectedItemHash,
      };
      expectedRootState.wishLists.wishListAndInfo.wishListRolls = [
        ...expectedRootState.wishLists.wishListAndInfo.wishListRolls,
        expectedWishListRollOne,
        expectedWishListRollTwo,
      ];
      const actualWishlistsByHash = wishListsByHashSelector(expectedRootState);
      expect(actualWishlistsByHash.get(expectedItemHash)).toEqual([
        expectedWishListRollOne,
        expectedWishListRollTwo,
      ]);
    });
  });

  describe('wishListRollsForItemHashSelector', () => {
    let expectedDimItems: DimItem[], expectedDimItem: DimItem, expectedItemHash: number;

    beforeAll(async () => {
      expectedDimItems = expectedRootState.inventory.stores[0].items as DimItem[];
    });

    beforeEach(() => {
      expectedDimItem = chance.pickone(expectedDimItems);
    });

    it('should return nothing when item hash is not included in the wishlist rolls', () => {
      const actualWishListRollsForItemHash = wishListRollsForItemHashSelector(expectedDimItem);
      expect(actualWishListRollsForItemHash(expectedRootState)).toEqual([]);
    });

    it('should return wishlist rolls when item hash is included in the wishlist rolls', () => {
      expectedItemHash = expectedDimItem.hash;
      const expectedWishListRoll = {
        ...getTestWishListRoll(chance),
        itemHash: expectedItemHash,
      };
      expectedRootState.wishLists.wishListAndInfo.wishListRolls = [
        ...expectedRootState.wishLists.wishListAndInfo.wishListRolls,
        expectedWishListRoll,
      ];
      const actualWishListRollsForItemHash = wishListRollsForItemHashSelector(expectedDimItem);
      expect(actualWishListRollsForItemHash(expectedRootState)).toContain(expectedWishListRoll);
    });

    it('should return wishlist rolls when item any item category hash is included in the wishlist rolls', () => {
      const expectedItemCategoryHash = chance.pickone(expectedDimItem.itemCategoryHashes);
      const expectedWishListRoll = {
        ...getTestWishListRoll(chance),
        itemHash: expectedItemCategoryHash,
      };
      expectedRootState.wishLists.wishListAndInfo.wishListRolls = [
        ...expectedRootState.wishLists.wishListAndInfo.wishListRolls,
        expectedWishListRoll,
      ];
      const actualWishListRollsForItemHash = wishListRollsForItemHashSelector(expectedDimItem);
      expect(actualWishListRollsForItemHash(expectedRootState)).toContain(expectedWishListRoll);
    });
  });
});
