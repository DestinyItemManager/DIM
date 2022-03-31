import { consolidateSecondaryPerks } from './wishlistCollapser';

describe('perkConsolidator', () => {
  it('does its thing', () => {
    expect(
      consolidateSecondaryPerks([
        {
          secondaryPerksMap: { 1: 4134353779, 2: 1482024992 },
          secondarySocketIndices: [1, 2],
        },
        {
          secondaryPerksMap: { 1: 4134353779, 2: 1467527085 },
          secondarySocketIndices: [1, 2],
        },
        {
          secondaryPerksMap: { 1: 106909392, 2: 1332244541 },
          secondarySocketIndices: [1, 2],
        },
        {
          secondaryPerksMap: { 1: 106909392, 2: 1467527085 },
          secondarySocketIndices: [1, 2],
        },
      ] as any)
    ).toEqual([
      [[4134353779], [1467527085, 1482024992]],
      [[106909392], [1332244541, 1467527085]],
    ]);
  });
});
