import { StatsSet } from './stats-set';

test('insertAll 1', () => {
  const inputs: [number[], string][] = [
    [[1, 2, 3], 'a'],
    [[1, 1, 2], 'b'],
    [[1, 1, 1], 'c'],
  ];

  const statsSet = new StatsSet<string>();

  for (const [stats, item] of inputs) {
    statsSet.insert(stats, item);
  }

  // expect(statsSet).toMatchSnapshot('internal');

  expect(statsSet.doBetterStatsExist([1, 2, 3])).toBe(false);
  expect(statsSet.doBetterStatsExist([1, 1, 2])).toBe(true);
  expect(statsSet.doBetterStatsExist([1, 1, 3])).toBe(true);
  expect(statsSet.doBetterStatsExist([1, 2, 2])).toBe(true);
  expect(statsSet.doBetterStatsExist([2, 1, 1])).toBe(false);
  expect(statsSet.doBetterStatsExist([1, 4, 0])).toBe(false);
  expect(statsSet.doBetterStatsExist([0, 0, 0])).toBe(true);
});
