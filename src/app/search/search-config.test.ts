import _ from 'lodash';
import { energyCapacityTypeNames } from './d2-known-values';
import { FilterDefinition } from './filter-types';
import { buildSearchConfig, generateSuggestionsForFilter } from './search-config';
import { allStatNames, searchableArmorStatNames } from './search-filter-values';

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
    (format: FilterDefinition['format'], keywords: string, suggestions?: string[]) => {
      const candidates = generateSuggestionsForFilter({
        format,
        keywords,
        suggestions,
        description: '',
        filter: () => _.stubTrue,
      });
      expect(candidates).toMatchSnapshot();
    }
  );
});

test('buildSearchConfig generates a reasonable filter map', () => {
  const searchConfig = buildSearchConfig(2);
  expect(Object.keys(searchConfig.filters)).toMatchSnapshot();
});
