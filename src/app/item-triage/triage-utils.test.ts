import { DimStat } from 'app/inventory/item-types';
import { armorStats } from 'app/search/d2-known-values';
import { compareBetterStats } from './triage-utils';

describe('triage armor comparison works', () => {
  type Stats = [number, number, number, number, number, number];
  const compare = (
    left: Stats,
    right: Stats,
    leftArtifice: boolean,
  ): 'left' | 'right' | undefined => {
    const statsToDict = (stats: Stats) =>
      Object.fromEntries(
        armorStats.map((hash, index) => [hash, { base: stats[index] } as DimStat]),
      );
    const leftStats = statsToDict(left);
    const rightStats = statsToDict(right);
    const result = compareBetterStats(leftStats, rightStats, leftArtifice, armorStats);
    return result === leftStats ? 'left' : result === rightStats ? 'right' : undefined;
  };

  test('works for non-artifice armor', () => {
    expect(compare([7, 8, 9, 10, 11, 12], [8, 9, 10, 11, 12, 13], false)).toBe('right');
    expect(compare([7, 8, 9, 10, 11, 12], [7, 8, 9, 10, 11, 12], false)).toBe(undefined);
    expect(compare([7, 8, 9, 10, 11, 12], [6, 9, 8, 10, 11, 12], false)).toBe(undefined);
    expect(compare([7, 8, 9, 10, 13, 12], [7, 8, 9, 10, 11, 12], false)).toBe('left');
  });

  test('works for artifice armor', () => {
    // Left is equal or not worse
    expect(compare([4, 8, 9, 10, 11, 12], [7, 8, 9, 10, 11, 12], true)).toBe('left');
    // Left can still be better in some stats even if not in all of them
    expect(compare([1, 1, 2, 3, 4, 5], [3, 4, 5, 6, 7, 8], true)).toBe(undefined);
    expect(compare([4, 7, 9, 10, 11, 12], [7, 8, 9, 10, 11, 12], true)).toBe(undefined);
    expect(compare([0, 1, 2, 3, 4, 5], [15, 16, 17, 5, 19, 20], true)).toBe(undefined);

    expect(compare([6, 8, 9, 10, 11, 12], [7, 8, 9, 10, 11, 12], true)).toBe('left');
    expect(compare([0, 1, 2, 3, 4, 5], [3, 4, 5, 6, 7, 8], true)).toBe('right');
  });
});
