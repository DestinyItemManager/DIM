import { AccountCurrency } from 'app/inventory/store-types';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import React from 'react';
import { useSelector } from 'react-redux';
import renderer from 'react-test-renderer';
import AccountCurrencies from './AccountCurrencies';

// Use the same display info for everything
const fakeDisplay: DestinyDisplayPropertiesDefinition = {
  description: 'Used to convert an unlocked Warlock armor item to a universal ornament.',
  name: 'Synthweave Bolt',
  icon: '/common/destiny2_content/icons/182e59137a78545602c64f844b549bad.jpg',
  iconSequences: [
    {
      frames: [
        '/common/destiny2_content/icons/182e59137a78545602c64f844b549bad.jpg',
        '/common/destiny2_content/icons/5c256c38ef115ca0257d6e2592a3643a.png',
      ],
    },
  ],
  highResIcon: '',
  hasIcon: true,
};

// Glimmer, legendary shards, silver
const basicCurrencies: AccountCurrency[] = [
  {
    itemHash: 3159615086,
    quantity: 102488,
    displayProperties: fakeDisplay,
  },
  {
    itemHash: 1022552290,
    quantity: 15777,
    displayProperties: fakeDisplay,
  },
  {
    itemHash: 2817410917,
    quantity: 8763,
    displayProperties: fakeDisplay,
  },
];

const synthstuff: AccountCurrency[] = [
  {
    itemHash: 4019412287,
    quantity: 10,
    displayProperties: fakeDisplay,
  },
  {
    itemHash: 4238733045,
    quantity: 11,
    displayProperties: fakeDisplay,
  },
  {
    itemHash: 1498161294,
    quantity: 11,
    displayProperties: fakeDisplay,
  },
];

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

/** Render some currencies and assert that the right number of icons are rendered */
function testCurrencies(currencies: AccountCurrency[]) {
  // This is a kind of hacky way to mock out redux
  (useSelector as jest.Mock<AccountCurrency[]>).mockReturnValue(currencies);
  const tree = renderer.create(<AccountCurrencies />);
  // We expect one image per currency
  expect(tree.root.findAllByType('img').length).toBe(currencies.length);
}

it('renders correctly with the basic currencies', () => {
  testCurrencies(basicCurrencies);
});

it('renders correctly with the basic currencies and synth stuff', () => {
  testCurrencies([...basicCurrencies, ...synthstuff]);
});
