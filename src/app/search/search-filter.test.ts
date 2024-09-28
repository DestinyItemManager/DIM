import { ItemFilterDefinition } from './items/item-filter-types';
import { rangeStringToComparator } from './search-filter';
import { allStatNames, searchableArmorStatNames } from './search-filter-values';
import { generateSuggestionsForFilter } from './suggestions-generation';

describe('generateSuggestionsForFilter', () => {
  const cases: [
    format: ItemFilterDefinition['format'],
    keywords: ItemFilterDefinition['keywords'],
    suggestions: ItemFilterDefinition['suggestions'],
    overload: { [key: string]: number } | undefined,
  ][] = [
    [undefined, ['a', 'b', 'c'], undefined, undefined],
    ['query', 'a', ['b', 'c'], undefined],
    ['stat', 'a', ['b', 'c'], undefined],
    ['range', 'a', undefined, undefined],
    ['range', 'a', undefined, { worthy: 10, arrivals: 11 }],
    ['freeform', 'a', ['b', 'c'], undefined],
    [undefined, ['a'], undefined, undefined],
    ['stat', 'stat', allStatNames, undefined],
    ['query', 'maxstatvalue', searchableArmorStatNames, undefined],
    ['query', 'maxstatvalue', searchableArmorStatNames, undefined],
    ['range', 'energycapacity', undefined, undefined],
  ];

  test.each(cases)(
    "full suggestions for filter format '%s', keyword '%s' with suggestions %s, overload %s",
    (
      format: ItemFilterDefinition['format'],
      keywords: string | string[],
      suggestions?: string[],
      overload?: { [key: string]: number },
    ) => {
      const candidates = generateSuggestionsForFilter(
        {
          format,
          keywords,
          suggestions,
          overload,
        },
        {},
      );
      expect(candidates).toMatchSnapshot();
    },
  );
});

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
    },
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
    },
  );
});
