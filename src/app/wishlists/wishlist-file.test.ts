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
  expect(toWishList(wishlist).wishListRolls[0]).toStrictEqual(result);
});

const autoUpgradeCases: [wishlist: string, results: WishListRoll[]][] = [
  [
    'dimwishlist:item=-69420&perks=2610012052,4104185692#notes:Golden Tricorn / Frenzy',
    [
      {
        itemHash: -69420,
        recommendedPerks: new Set([2610012052, 4104185692]),
        notes: 'Golden Tricorn / Frenzy',
        isExpertMode: true,
        isUndesirable: false,
      },
      {
        itemHash: -69420,
        recommendedPerks: new Set([4104185692, 4290541820]),
        notes: 'Golden Tricorn / Frenzy',
        isExpertMode: true,
        isUndesirable: false,
      },
      {
        itemHash: -69420,
        recommendedPerks: new Set([4290541820, 3007133316]),
        notes: 'Golden Tricorn / Frenzy',
        isExpertMode: true,
        isUndesirable: false,
      },
      {
        itemHash: -69420,
        recommendedPerks: new Set([2610012052, 3007133316]),
        notes: 'Golden Tricorn / Frenzy',
        isExpertMode: true,
        isUndesirable: false,
      },
    ],
  ],
];

test.each(autoUpgradeCases)('parse wishlist line with enhanced trait: %s', (wishlist, result) => {
  expect(toWishList(wishlist).wishListRolls).toStrictEqual(result);
});
