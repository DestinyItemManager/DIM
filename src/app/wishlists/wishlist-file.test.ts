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
      description: undefined,
      sourceWishListIndex: 0,
      title: undefined,
    },
  ],
  [
    `
//notes:Example1 with\\nline break working
dimwishlist:item=-69420&perks=2682205016,2402480669`,
    {
      itemHash: -69420,
      recommendedPerks: new Set([2682205016, 2402480669]),
      notes: 'Example1 with\nline break working',
      isExpertMode: true,
      isUndesirable: false,
      description: undefined,
      sourceWishListIndex: 0,
      title: undefined,
    },
  ],
  [
    `dimwishlist:item=-69420&perks=2682205016,2402480669#notes:Example2 with\\nline break working`,
    {
      itemHash: -69420,
      recommendedPerks: new Set([2682205016, 2402480669]),
      notes: 'Example2 with\nline break working',
      isExpertMode: true,
      isUndesirable: false,
      description: undefined,
      sourceWishListIndex: 0,
      title: undefined,
    },
  ],
];

test.each(cases)('parse wishlist line: %s', (wishlist, result) => {
  expect(toWishList([[undefined, wishlist]]).wishListRolls[0]).toStrictEqual(result);
});
