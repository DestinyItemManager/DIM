import { WishListRoll } from './types';
import { toWishList } from './wishlist-file';

const cases: [wishlist: string, result: WishListRoll][] = [
  [
    'dimwishlist:item=-69420&perks=3643424744,2896038713#notes:Over, FocuFury',
    {
      itemHash: -69420,
      recommendedPerks: new Set([3643424744, 2896038713]),
      notes: 'Over, FocuFury',
      isExpertMode: true,
      isUndesirable: false,
    },
  ],
];

test.each(cases)('parse wishlist line: %s', (wishlist, result) => {
  expect(toWishList(wishlist).wishListRolls[0]).toStrictEqual(result);
});
