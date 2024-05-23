import { canonicalFilterFormats } from 'app/search/filter-types';
import { buildFiltersMap } from 'app/search/search-config';
import { allLoadoutFilters } from './loadout-search-filter';

describe('buildSearchConfig', () => {
  const searchConfig = buildFiltersMap(2, allLoadoutFilters);

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
     * range filters can also accept single words as filter value,
     * because `season:worthy` is actually `season:10` and we don't
     * want these to be mistaken for queries or freeforms.
     */

    for (const filter of searchConfig.allFilters) {
      let formats = canonicalFilterFormats(filter.format);

      if (formats.length < 1) {
        throw new Error(`filter ${filter.keywords} has no formats`);
      }

      formats = formats.filter(
        (f) => f === 'query' || f === 'freeform' || (f === 'range' && filter.overload),
      );
      if (formats.length > 1) {
        throw new Error(`filter ${filter.keywords} specifies ambiguous formats ${formats}`);
      }
    }
  });
});
