import { WishListRoll } from './types';
import { toWishList } from './wishlist-file';

const cases: [wishlist: string, result: WishListRoll][] = [
  [
    'dimwishlist:item=-69420&perks=2682205016,2402480669#notes:Enh Over, Enh FocuFury',
    {
      itemHash: -69420,
      recommendedPerks: new Set([2682205016, 2402480669]),
      notes: 'Enh Over, Enh FocuFury',
      isExpertMode: true,
      isUndesirable: false,
    },
  ],
];

test.each(cases)('parse wishlist line: %s', (wishlist, result) => {
  expect(toWishList([[undefined, wishlist]]).wishListRolls[0]).toStrictEqual(result);
});
