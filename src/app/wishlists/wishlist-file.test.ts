import { WishListRoll } from './types';
import { toWishList } from './wishlist-file';

const cases: [wishlist: string, results: WishListRoll[]][] = [
  [
    'dimwishlist:item=-69420&perks=2682205016,2402480669#notes:Enh Over, Enh FocuFury',
    [
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
  ],
  [
    JSON.stringify({
      name: "Aegis's endgame rolls and rankings",
      description: "Recommendations from Aegis's endgame analysis spreadsheet.",
      data: [
        {
          hash: 4164201232,
          plugs: [[29505215], [3400784728], [3523296417, 2610012052]],
          tags: ['PVE'],
          description: 'F-Tier\nTT but no usable damage perk',
        },
      ],
    }),
    [
      {
        itemHash: 4164201232,
        recommendedPerks: new Set([3400784728, 3523296417]),
        notes: 'Tags: PVE | Notes: F-Tier\nTT but no usable damage perk',
        isExpertMode: true,
        description: "Recommendations from Aegis's endgame analysis spreadsheet.",
        sourceWishListIndex: 0,
        title: "Aegis's endgame rolls and rankings",
      },
      {
        itemHash: 4164201232,
        recommendedPerks: new Set([3400784728, 2610012052]),
        notes: 'Tags: PVE | Notes: F-Tier\nTT but no usable damage perk',
        isExpertMode: true,
        description: "Recommendations from Aegis's endgame analysis spreadsheet.",
        sourceWishListIndex: 0,
        title: "Aegis's endgame rolls and rankings",
      },
    ],
  ],
];

describe('toWishList', () => {
  test.each(cases)('parse wishlist line: %s', (wishlist, results) => {
    const parsed = toWishList([[undefined, wishlist]]).wishListRolls;
    expect(parsed).toHaveLength(results.length);
    for (const [i, expected] of results.entries()) {
      expect(parsed[i]).toStrictEqual(expected);
    }
  });

  test('does not parse destinytracker URLs', () => {
    const dtrUrl = 'https://destinytracker.com/destiny-2/db/items/12345?perks=1,2,3#notes:test';
    const result = toWishList([[undefined, dtrUrl]]);
    expect(result.wishListRolls).toHaveLength(0);
  });

  test('does not parse banshee-44 URLs', () => {
    const bansheeUrl = 'https://banshee-44.com/?weapon=12345&socketEntries=1,2,3#notes:test';
    const result = toWishList([[undefined, bansheeUrl]]);
    expect(result.wishListRolls).toHaveLength(0);
  });
});
