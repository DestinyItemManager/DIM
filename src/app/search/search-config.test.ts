import { canonicalFilterFormats, FilterFormat } from './filter-types';
import { buildSearchConfig } from './search-config';

describe('buildSearchConfig', () => {
  const searchConfig = buildSearchConfig(2);

  test('generates a reasonable filter map', () => {
    expect(Object.keys(searchConfig.isFilters).sort()).toMatchSnapshot('is filters');
    expect(Object.keys(searchConfig.kvFilters).sort()).toMatchSnapshot('key-value filters');
  });

  test('filter formats specify unambiguous formats ', () => {
    /*
     * We have a bunch of filter formats for which `keyword:value`
     * with purely alphabetic values can be valid syntax. Filters should
     * avoid specifying more than one of these.
     * query and freeform filters are sort of the same thing,
     * except queries are exhaustive and freeform aren't. Overloaded
     * stat filters can also accept single words as filter value,
     * because `season:worthy` is actually `season:10` and we don't
     * want these to be mistaken for queries or freeforms.
     */

    const conflictingFilterFormats: FilterFormat[] = ['query', 'freeform', 'rangeoverload'];
    for (const filter of searchConfig.allFilters) {
      let formats = canonicalFilterFormats(filter.format);

      if (formats.length < 1) {
        throw new Error(`filter ${filter.keywords} has no formats`);
      }

      formats = formats.filter((f) => conflictingFilterFormats.includes(f));
      if (formats.length > 1) {
        throw new Error(`filter ${filter.keywords} specifies ambiguous formats ${formats}`);
      }
    }
  });
});
