import { FilterDefinition } from './filter-types';
import { allStatNames, searchableArmorStatNames } from './search-filter-values';
import { generateSuggestionsForFilter } from './suggestions-generation';

describe('generateSuggestionsForFilter', () => {
  const cases: [
    format: FilterDefinition['format'],
    keywords: FilterDefinition['keywords'],
    suggestions: FilterDefinition['suggestionKeywords'],
    overload: { [key: string]: number } | undefined
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
      format: FilterDefinition['format'],
      keywords: string | string[],
      suggestions?: string[],
      overload?: { [key: string]: number } | undefined
    ) => {
      const candidates = generateSuggestionsForFilter({
        format,
        keywords,
        suggestionKeywords: suggestions,
        overload,
      });
      expect(candidates).toMatchSnapshot();
    }
  );
});
