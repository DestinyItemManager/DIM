import {
  canTakeAllSeasonalMods,
  sortProcessModsOrProcessItems,
  ProcessItemSubset,
} from './processUtils';
import { ProcessModMetadata } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';

function getMod(season: number, tag: string, energyType: DestinyEnergyType): ProcessModMetadata {
  return { season, tag, energyType };
}

function getItem(
  season: number,
  energyType: DestinyEnergyType,
  compatibleModSeasons?: string[]
): ProcessItemSubset {
  return {
    energyType,
    season,
    compatibleModSeasons,
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
