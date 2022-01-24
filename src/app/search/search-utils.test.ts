import { energyCapacityTypeNames } from './d2-known-values';
import { FilterDefinition } from './filter-types';
import { allStatNames, searchableArmorStatNames } from './search-filter-values';
import { generateSuggestionsForFilter } from './suggestions-generation';

describe('generateSuggestionsForFilter', () => {
  const cases: [
    format: FilterDefinition['format'],
    keywords: FilterDefinition['keywords'],
    suggestions: FilterDefinition['suggestions']
  ][] = [
    [undefined, ['a', 'b', 'c'], undefined],
    ['query', 'a', ['b', 'c']],
    ['range', 'a', ['b', 'c']],
    ['range', 'a', undefined],
    ['rangeoverload', 'a', ['b', 'c']],
    ['freeform', 'a', ['b', 'c']],
    [undefined, ['a'], undefined],
    ['range', 'stat', allStatNames],
    ['query', 'maxstatvalue', searchableArmorStatNames],
    ['query', 'maxstatvalue', searchableArmorStatNames],
    ['rangeoverload', 'energycapacity', energyCapacityTypeNames],
  ];

  test.each(cases)(
    "full suggestions for filter format '%s', keyword '%s' with suggestions %s",
    (format: FilterDefinition['format'], keywords: string | string[], suggestions?: string[]) => {
      const candidates = generateSuggestionsForFilter({
        format,
        keywords,
        suggestions,
      });
      expect(candidates).toMatchSnapshot();
    }
  );
});
