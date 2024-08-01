import { RootState } from 'app/store/types';
import Chance from 'chance';
import { getTestRootState } from 'testing/test-utils';
import { wishListsLastFetchedSelector, wishListsSelector } from './selectors';

const chance = Chance();

describe('wishlists selectors', () => {
  let expectedRootState: RootState;
  beforeEach(() => {
    expectedRootState = getTestRootState(chance);
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
});
