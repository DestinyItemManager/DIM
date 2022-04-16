import { consolidateSecondaryPerks } from './wishlist-collapser';

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
    ).toMatchInlineSnapshot(`
      Array [
        Array [
          Array [
            4134353779,
          ],
          Array [
            1482024992,
          ],
        ],
        Array [
          Array [
            106909392,
          ],
          Array [
            1332244541,
          ],
        ],
        Array [
          Array [
            106909392,
            4134353779,
          ],
          Array [
            1467527085,
          ],
        ],
      ]
    `);
  });
});
