import {
  canTakeAllSeasonalMods,
  sortProcessModsOrProcessItems,
  ProcessItemSubset,
} from './processUtils';
import { ProcessMod } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';

function getMod(
  season: number,
  tag: string,
  energyType: DestinyEnergyType,
  energyCost: number = 0
): ProcessMod {
  return {
    season,
    tag,
    energy: { type: energyType, val: energyCost },
    investmentStats: [],
    hash: 0, // need to mock this unfortunately
  };
}

function getItem(
  season: number,
  energyType: DestinyEnergyType,
  compatibleModSeasons?: string[],
  energyCost: number = 0
): ProcessItemSubset {
  return {
    energy: { type: energyType, val: energyCost },
    season,
    compatibleModSeasons,
    id: 'id', // need to mock this unfortunately
  };
}

/* Mods need to be sorted by sortSeasonalModsOrItems. Items are sorted inside canTakeAllSeasonalMods */

/*
  Can take all the mods cases
*/
describe('Can slot seasonal mods', () => {
  it('passes for correct seasons with correct energy', () => {
    const mods = [
      getMod(11, 'arrivals', 3),
      getMod(11, 'arrivals', 3),
      getMod(10, 'worthy', 3),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(9, 3, ['worthy', 'dawn', 'undying']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });

  it('passes when it needs to backtrack for an any mod', () => {
    const mods = [
      getMod(11, 'arrivals', 2),
      getMod(11, 'arrivals', 1),
      getMod(11, 'arrivals', 0),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 2, ['arrivals', 'worthy']),
      getItem(11, 1, ['arrivals', 'worthy']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });

  it('passes when all are any mods', () => {
    const mods = [
      getMod(11, 'arrivals', 0),
      getMod(11, 'arrivals', 0),
      getMod(11, 'arrivals', 0),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 2, ['arrivals', 'worthy']),
      getItem(11, 1, ['arrivals', 'worthy']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });

  it('passes with a single mod', () => {
    const mods = [getMod(11, 'arrivals', 1)].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 2, ['arrivals', 'worthy']),
      getItem(11, 1, ['arrivals', 'worthy']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });

  it('passes when the first item takes no mods', () => {
    const mods = [getMod(7, 'opulent', 0), getMod(7, 'opulent', 0)].sort(
      sortProcessModsOrProcessItems
    );

    const items = [
      getItem(8, 2, ['undying', 'dawn', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(8, 2, ['opulent', 'undying', 'dawn']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(false);
  });
});

/*
  Can't take all the mods cases
*/
describe("Can't slot seasonal mods", () => {
  it('fails when an energy mismatches', () => {
    const mods = [
      getMod(11, 'arrivals', 3),
      getMod(11, 'arrivals', 3),
      getMod(11, 'arrivals', 1),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(false);
  });

  it('fails when a season mismatches', () => {
    const mods = [getMod(11, 'arrivals', 3), getMod(11, 'arrivals', 3), getMod(9, 'dawn', 3)].sort(
      sortProcessModsOrProcessItems
    );

    const items = [
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(false);
  });

  it('fails when an item has no mod slot', () => {
    const mods = [
      getMod(11, 'arrivals', 3),
      getMod(11, 'arrivals', 3),
      getMod(11, 'arrivals', 3),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(8, 3, undefined),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(false);
  });

  it('fails when first slot cant be used and only one item to take both mods', () => {
    const mods = [getMod(7, 'opulent', 0), getMod(7, 'opulent', 0)].sort(
      sortProcessModsOrProcessItems
    );

    const items = [
      getItem(9, 2, ['undying', 'dawn', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(8, 2, ['opulent', 'undying', 'dawn']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(false);
  });
});

/*
  Ensuring the sorting works
*/
describe('Sorting works for mods and items', () => {
  it('passes when items are sorted for energy', () => {
    const mods = [
      getMod(11, 'arrivals', 3),
      getMod(11, 'arrivals', 2),
      getMod(11, 'arrivals', 1),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 1, ['arrivals', 'worthy']),
      getItem(11, 2, ['arrivals', 'worthy']),
      getItem(11, 3, ['arrivals', 'worthy']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });

  it('passes when mods are sorted for energy', () => {
    const mods = [
      getMod(11, 'arrivals', 1),
      getMod(11, 'arrivals', 2),
      getMod(11, 'arrivals', 3),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 3, ['arrivals', 'worthy']),
      getItem(11, 2, ['arrivals', 'worthy']),
      getItem(11, 1, ['arrivals', 'worthy']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });

  it('passes when mods are sorted for season', () => {
    const mods = [getMod(9, 'dawn', 1), getMod(10, 'worthy', 1), getMod(11, 'arrivals', 1)].sort(
      sortProcessModsOrProcessItems
    );

    const items = [
      getItem(11, 1, ['arrivals', 'worthy']),
      getItem(10, 1, ['arrivals', 'worthy', 'dawn']),
      getItem(9, 1, ['worthy', 'dawn', 'undying']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });

  it('passes when items are sorted for season', () => {
    const mods = [getMod(11, 'arrivals', 1), getMod(10, 'worthy', 1), getMod(9, 'dawn', 1)].sort(
      sortProcessModsOrProcessItems
    );

    const items = [
      getItem(10, 1, ['arrivals', 'worthy', 'dawn']),
      getItem(11, 1, ['arrivals', 'worthy']),
      getItem(9, 1, ['worthy', 'dawn', 'undying']),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });
});

/*
  Ensuring the energy requirement part works
*/
describe('Energy requirements correctly filter a set', () => {
  it('passes when items and mods add up to 10', () => {
    const mods = [
      getMod(11, 'arrivals', 2, 5),
      getMod(11, 'arrivals', 1, 5),
      getMod(11, 'arrivals', 3, 5),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 1, ['arrivals', 'worthy'], 5),
      getItem(11, 2, ['arrivals', 'worthy'], 5),
      getItem(11, 3, ['arrivals', 'worthy'], 5),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });

  it('fails when one item and mod add up to more than 10', () => {
    const mods = [
      getMod(11, 'arrivals', 2, 5),
      getMod(11, 'arrivals', 1, 5),
      getMod(11, 'arrivals', 3, 5),
    ].sort(sortProcessModsOrProcessItems);

    const items = [
      getItem(11, 1, ['arrivals', 'worthy'], 5),
      getItem(11, 2, ['arrivals', 'worthy'], 6),
      getItem(11, 3, ['arrivals', 'worthy'], 5),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(false);
  });

  it('passes when an any mod needs the first mods space', () => {
    const mods = [getMod(11, 'arrivals', 2, 4), getMod(11, 'arrivals', 0, 5)].sort(
      sortProcessModsOrProcessItems
    );

    const items = [
      getItem(11, 2, ['arrivals', 'worthy'], 5),
      getItem(11, 2, ['arrivals', 'worthy'], 6),
    ];

    const result = canTakeAllSeasonalMods(mods, items);
    expect(result).toEqual(true);
  });
});
