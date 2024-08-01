import Chance from 'chance';
import { getTestRootState } from 'testing/test-utils';
import { wishListsSelector } from './selectors';

const chance = Chance();

describe('wishlists selectors', () => {
  describe('wishListsSelector', () => {
    it('should return wishlists from state', () => {
      const expectedRootState = getTestRootState(chance);
      const actualRootStateWishlists = wishListsSelector(expectedRootState);

      expect(actualRootStateWishlists).toEqual(expectedRootState.wishLists);
    });
  });
});
