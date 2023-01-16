import { StatHashes } from 'app/../data/d2/generated-enums';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { ArmorStatHashes } from '../types';
import { createGeneralModsCache, getViableGeneralModPicks, ModsPick } from './auto-stat-mod-utils';
import { ProcessMod } from './types';

const statOrder: ArmorStatHashes[] = [
  StatHashes.Mobility,
  StatHashes.Resilience,
  StatHashes.Recovery,
  StatHashes.Discipline,
  StatHashes.Intellect,
  StatHashes.Strength,
];

const expectSortedDescending = (array: number[]) => {
  expect(array).toStrictEqual([...array].sort().reverse());
};

const expectAllSorted = (picks: ModsPick[]) => {
  for (const pick of picks) {
    expectSortedDescending(pick.costs);
  }
};

describe('lo process auto stat mod pick generation', () => {
  const cache = createGeneralModsCache([], statOrder, true);

  test('cache actually caches things', () => {
    const result1 = getViableGeneralModPicks(cache, [7, 0, 0, 13, 0, 5]);
    // Same effective stats needed
    const result2 = getViableGeneralModPicks(cache, [6, 0, 0, 14, 0, 3]);
    // Need different stats
    const result3 = getViableGeneralModPicks(cache, [5, 0, 0, 14, 0, 6]);
    // Object equality
    expect(result1).toBe(result2);
    expect(result1).not.toBe(result3);
    expect(result1).toHaveLength(2);
    expect(result3).toHaveLength(2);
  });

  const check = (stats: number[], result: number) => {
    const picks = getViableGeneralModPicks(cache, stats);
    expect(picks).toHaveLength(result);
    expectAllSorted(picks);
  };

  test.each([
    [[50, 5, 0, 0, 0, 0], 0],
    [[40, 5, 5, 0, 0, 0], 0],
    [[10, 10, 10, 10, 10, 10], 0],
    [[5, 5, 5, 5, 5, 5], 0],
    [[0, 0, 0, 20, 20, 20], 0],
  ])('does not come up with too many mods for needed stats %j', check);

  test.each([
    [[50, 0, 0, 0, 0, 0], 1],
    [[0, 5, 5, 30, 0, 0], 1],
    [[10, 10, 10, 10, 10, 0], 1],
    [[5, 5, 5, 5, 5, 0], 1],
    [[0, 0, 0, 20, 20, 10], 1],
  ])('identifies unique solution %j', (stats, result) => {
    const picks = getViableGeneralModPicks(cache, stats);
    expect(picks).toHaveLength(result);
    expectAllSorted(picks);
  });

  test.each([
    [[40, 0, 0, 0, 0, 0], 2],
    [[30, 0, 0, 0, 0, 0], 3],
    [[20, 0, 0, 0, 0, 0], 3],
    [[10, 0, 0, 0, 0, 0], 2],
  ])('for same stats %j generates %i different picks', check);

  test.each([
    [[30, 10, 0, 0, 0, 0], 2],
    [[10, 20, 0, 0, 0, 0], 3],
    [[10, 10, 0, 0, 0, 0], 3],
  ])('for stats %j with same mod costs generates minimal equivalent picks %i', check);

  test.each([
    // split [none, int, int+rec] (but not rec alone)
    [[0, 0, 10, 0, 10, 0], 3],
    // split [none, int, res, int+rec, int+res] (but not rec+res)
    [[0, 10, 10, 0, 10, 0], 5],
    // split [none, rec, mob, mob+mob, rec+mob]
    [[20, 0, 10, 0, 0, 0], 5],
  ])('does not split recovery if intellect can be split for stats %j, generating %i picks', check);

  test.each([
    [[10, 0, 5, 5, 0, 0], 2],
    [[10, 0, 5, 5, 5, 0], 2],
    [[10, 10, 5, 5, 0, 0], 2],
    [[10, 10, 5, 0, 0, 0], 3],
    [[15, 15, 0, 0, 0, 0], 2],
    [[10, 15, 0, 0, 0, 0], 3],
  ])('obeys required minor mods %j to generate %i picks', check);
});

describe('lo process auto stat mod pick generation with 1 existing mod', () => {
  const existingMod: ProcessMod = {
    // all of this is ignored anyway
    hash: -123,
    investmentStats: [],
    plugCategoryHash: -456,
    energy: {
      type: DestinyEnergyType.Any,
      val: 5,
    },
  };

  const cache = createGeneralModsCache([existingMod], statOrder, true);

  const check = (stats: number[], result: number) => {
    const picks = getViableGeneralModPicks(cache, stats);
    expect(picks).toHaveLength(result);
    expectAllSorted(picks);
  };

  test.each([
    [[50, 0, 0, 0, 0, 0], 0],
    [[40, 0, 0, 0, 0, 0], 1],
    [[30, 0, 0, 0, 0, 0], 2],
    [[20, 0, 0, 0, 0, 0], 3],
    [[10, 0, 0, 0, 0, 0], 2],
  ])('generating picks for %j, only coming up with %i picks', check);

  test.each([
    [[15, 15, 5, 0, 0, 0], 0],
    [[15, 15, 0, 0, 0, 0], 1],
    [[15, 0, 10, 0, 0, 0], 3],
    [[0, 0, 20, 0, 20, 0], 1],
    [[0, 0, 10, 0, 20, 0], 2],
  ])('generating picks for %j, only coming up with %i picks', check);
});
