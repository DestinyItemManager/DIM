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

describe('rangeStringToComparatorWithOverloads', () => {
  const overloads = { worthy: 10, arrivals: 11 };
  const cases: [input: string, reference: number, result: boolean][] = [
    ['<worthy', 8, true],
    ['<worthy', 10, false],
    ['>10', 10, false],
    ['>10', 15, true],
    ['<=worthy', 10, true],
    ['>=worthy', 10, true],
    ['=worthy', 10, true],
    ['=worthy', 15, false],
    ['arrivals', 11, true],
    ['arrivals', 10, false],
  ];

  test.each(cases)(
    "rangeStringToComparatorWithOverloads('%s')(%d) === %s",
    (input: string, reference: number, result: boolean) => {
      const fn = rangeStringToComparator(input, overloads);
      expect(fn(reference)).toBe(result);
    }
  );
});
