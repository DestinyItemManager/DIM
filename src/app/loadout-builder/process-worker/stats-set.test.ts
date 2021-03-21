import { StatsSet } from './stats-set';

const cases = [
  [
    [[1, 2, 3], 'a'],
    [[1, 1, 2], 'b'],
    [[1, 1, 1], 'c'],
  ],
];

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

  expect(statsSet).toMatchSnapshot('internal');
});
