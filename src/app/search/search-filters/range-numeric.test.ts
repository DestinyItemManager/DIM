import { rangeStringToComparator } from '../search-utils';

describe('rangeStringToComparator', () => {
  const cases: [input: string, reference: number, result: boolean][] = [
    ['<10', 8, true],
    ['<10', 10, false],
    ['>10', 10, false],
    ['>10', 15, true],
    ['<=10', 10, true],
    ['>=10', 10, true],
    ['<=10', 8, true],
    ['>=10', 15, true],
    ['<=10', 15, false],
    ['>=10', 8, false],
    ['=10', 10, true],
    ['=10', 15, false],
    ['10', 10, true],
  ];

  test.each(cases)(
    "rangeStringToComparator('%s')(%d) === %s",
    (input: string, reference: number, result: boolean) => {
      const fn = rangeStringToComparator(input);
      expect(fn(reference)).toBe(result);
    }
  );
});
