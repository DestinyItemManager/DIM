import { consolidateSecondaryPerks } from './wishlist-collapser';

describe('perkConsolidator', () => {
  it('does its thing', () => {
    expect(
      consolidateSecondaryPerks([
        {
          secondaryPerksMap: { 1: 4134353779, 2: 1482024992 },
          secondarySocketIndices: [1, 2],
          primaryPerksList: [],
          primarySocketIndices: [],
          primaryPerkIdentifier: '',
          primaryPerkIdentifierNormalized: '',
          secondaryPerkIdentifier: '',
        },

        {
          secondaryPerksMap: { 1: 4134353779, 2: 1467527085 },
          secondarySocketIndices: [1, 2],
          primaryPerksList: [],
          primarySocketIndices: [],
          primaryPerkIdentifier: '',
          primaryPerkIdentifierNormalized: '',
          secondaryPerkIdentifier: '',
        },

        {
          secondaryPerksMap: { 1: 106909392, 2: 1332244541 },
          secondarySocketIndices: [1, 2],
          primaryPerksList: [],
          primarySocketIndices: [],
          primaryPerkIdentifier: '',
          primaryPerkIdentifierNormalized: '',
          secondaryPerkIdentifier: '',
        },

        {
          secondaryPerksMap: { 1: 106909392, 2: 1467527085 },
          secondarySocketIndices: [1, 2],
          primaryPerksList: [],
          primarySocketIndices: [],
          primaryPerkIdentifier: '',
          primaryPerkIdentifierNormalized: '',
          secondaryPerkIdentifier: '',
        },
      ]),
    ).toMatchInlineSnapshot(`
      [
        [
          [
            4134353779,
          ],
          [
            1482024992,
          ],
        ],
        [
          [
            106909392,
          ],
          [
            1332244541,
          ],
        ],
        [
          [
            106909392,
            4134353779,
          ],
          [
            1467527085,
          ],
        ],
      ]
    `);
  });
});
