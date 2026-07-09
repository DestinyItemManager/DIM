import { sum } from 'es-toolkit';
import { count, objectifyArray, partitionEvenly, reorder, uniqBy, wrap } from './collections';

describe('count', () => {
  test('counts elements that match the predicate', () =>
    expect(count([1, 2, 3], (i) => i > 1)).toBe(2));
});

describe('partitionEvenly', () => {
  // [longest bucket size after filtering, concurrency]. Concurrency defaults to
  // ~half of hardwareConcurrency, so 2-8 is typical; a filtered armor bucket
  // ranges from a single exotic up to a few dozen items.
  const cases: [n: number, groups: number][] = [
    [37, 8], // items not a clean multiple of cores: the case that used to idle cores
    [42, 8],
    [50, 6],
    [24, 4],
    [15, 4],
    [11, 3],
    [7, 2],
    [1, 4], // one exotic in the slot, several cores available
    [4, 8], // fewer items than cores
    [8, 8], // items exactly match cores
  ];

  for (const [n, groups] of cases) {
    test(`splits ${n} items across ${groups} groups evenly`, () => {
      const items = Array.from({ length: n }, (_, i) => i);
      const slices = partitionEvenly(items, groups);

      // Uses every available group without producing empty ones.
      expect(slices.length).toBe(Math.min(groups, n));

      // Sizes are as balanced as possible (differ by at most one).
      const sizes = slices.map((s) => s.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(sum(sizes)).toBe(n);

      // Contiguous slices tile the input exactly, no dropped or duplicated items.
      expect(slices.flat()).toEqual(items);
    });
  }
});

describe('objectifyArray', () => {
  test('keys objects by a property name that maps to an array', () => {
    const input = [{ key: [1, 3] }, { key: [2, 4] }];
    const output = objectifyArray(input, 'key');
    const expected = {
      '1': { key: [1, 3] },
      '2': { key: [2, 4] },
      '3': { key: [1, 3] },
      '4': { key: [2, 4] },
    };
    expect(output).toEqual(expected);
  });
});

describe('wrap', () => {
  test('negative index', async () => {
    const index = wrap(-1, 2);
    expect(index).toBe(1);
  });
  test('too large index', async () => {
    const index = wrap(3, 2);
    expect(index).toBe(1);
  });
  test('too large index by a lot', async () => {
    const index = wrap(27, 5);
    expect(index).toBe(2);
  });
  test('negative index by a lot', async () => {
    const index = wrap(-27, 5);
    expect(index).toBe(3);
  });
});

describe('uniqBy', () => {
  test('identity', async () => {
    const result = uniqBy(['a', 'b', 'a', 'c'], (i) => i);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  test('object values', async () => {
    // If the iteree function produces objects, they need to be reference equal to count as dupes
    const val1 = { val: 'b' };
    const val2 = { val: 'other' };

    const result = uniqBy(['a', 'b', 'a', 'c'], (i) => (i === 'b' ? val1 : val2));
    expect(result).toEqual(['a', 'b']);
  });

  test('complex func', async () => {
    const result = uniqBy([{ val: 'a' }, { val: 'b' }, { val: 'a' }, { val: 'c' }], (i) => i.val);
    expect(result).toEqual([{ val: 'a' }, { val: 'b' }, { val: 'c' }]);
  });
});

describe('reorder', () => {
  test('reorders', () => {
    expect(reorder([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
  });
});
