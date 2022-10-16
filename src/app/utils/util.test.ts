import { count, objectifyArray } from './util';

describe('count', () => {
  test('counts elements that match the predicate', () =>
    expect(count([1, 2, 3], (i) => i > 1)).toBe(2));
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
