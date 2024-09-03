import { canonicalFilterFormats } from './filter-types';
import { buildItemFiltersMap } from './items/item-search-filter';
import { parseAndValidateQuery } from './search-filter';

describe('buildSearchConfig', () => {
  const searchConfig = buildItemFiltersMap(2);

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
        throw new Error(`filter ${filter.keywords.toString()} has no formats`);
      }

      formats = formats.filter(
        (f) => f === 'query' || f === 'freeform' || (f === 'range' && filter.overload),
      );
      if (formats.length > 1) {
        throw new Error(
          `filter ${filter.keywords.toString()} specifies ambiguous formats ${formats.toString()}`,
        );
      }
    }
  });
});

/**
 * The purpose of this test is to verify that `validateQuery` understands the syntax
 * formats in filter definitions, accepts valid queries and rejects invalid syntax.
 * We use well-known filters from the D2 search config for this, but testing all filters
 * exhaustively is not a goal of this test.
 */
describe('validateQuery', () => {
  const searchConfig = buildItemFiltersMap(2);

  const simpleCases: [filterString: string, valid: boolean][] = [
    ['is:crafted', true],
    ['not:crafted', true],
    ['crafted:is', false],
  ];

  test.each(simpleCases)('is: filter %s - validity %s', (filterString, valid) =>
    expect(parseAndValidateQuery(filterString, searchConfig).valid).toBe(valid),
  );

  const queryCases: [filterString: string, valid: boolean][] = [
    ['tag:favorite', true],
    ['tag:none', true],
    ['tag:any', false],
    ['is:tag', false],
    ['tag:<5', false],
    ['tag:recovery:17', false],
  ];

  test.each(queryCases)('query filter %s - validity %s', (filterString, valid) =>
    expect(parseAndValidateQuery(filterString, searchConfig).valid).toBe(valid),
  );

  const freeformCases: [filterString: string, valid: boolean][] = [
    ['notes:#hashtag', true],
    ['notes:verbatim:colon', true],
    ['notes"with spaces"', true],
    ['notes:<5', true],
    ['is:notes', false],
  ];

  test.each(freeformCases)('freeform filter %s - validity %s', (filterString, valid) =>
    expect(parseAndValidateQuery(filterString, searchConfig).valid).toBe(valid),
  );

  // `masterwork` is a complicated filter with three different formats
  const mixedCases: [filterString: string, valid: boolean][] = [
    ['is:masterwork', true],
    ['masterwork:range', true],
    ['masterwork:<5', true],
    ['masterwork:=5', true],
    ['masterwork:5', true],
    ['masterwork:rnage', false],
    ['masterwork:<range', false],
    ['masterwork:range:5', false],
  ];

  test.each(mixedCases)('mixed filter %s - validity %s', (filterString, valid) =>
    expect(parseAndValidateQuery(filterString, searchConfig).valid).toBe(valid),
  );

  const statCases: [filterString: string, valid: boolean][] = [
    ['stat:recovery:5', true],
    ['stat:recovery:<=5', true],
    ['stat:recovery+discipline:>=5', true],
    ['stat:highest&secondhighest:>20', true],
    ['stat:highest&recovery+strength&strength&range:>20', true],
    ['basestat:range:>50', true],

    ['stat:badstat:>20', false],
    ['stat:badstat&badcombo:>20', false],
    ['stat:too&+many:>20', false],
    ['is:stat', false],
    ['stat:recovery', false],
    ['stat:=5', false],
  ];

  test.each(statCases)('stat filter %s - validity %s', (filterString, valid) =>
    expect(parseAndValidateQuery(filterString, searchConfig).valid).toBe(valid),
  );

  const rangeCases: [filterString: string, valid: boolean][] = [
    ['count:2', true],
    ['count:=2', true],
    ['count:<=2', true],
    ['count:<=2.5', true],

    ['is:count', false],
    ['count:count', false],
    ['count:recovery', false],
    ['count:<=2:=2', false],
    ['count:<2>', false],
  ];

  test.each(rangeCases)('search string %s - validity %s', (filterString, valid) =>
    expect(parseAndValidateQuery(filterString, searchConfig).valid).toBe(valid),
  );

  const overloadRangeCases: [filterString: string, valid: boolean][] = [
    ['season:worthy', true],
    ['season:<=worthy', true],
    ['season:=worthy', true],
    ['season:>=arrival', true],
    ['season:222', true],
    ['season:=10', true],
    ['season:>2.5', true],

    ['is:season', false],
    // DIM used to parse this as `season:11` because `redwar` is `1`...
    ['season:1redwar', false],
    ['season:season', false],
    ['season:arrivals', false],
    ['season:arrivalworthy', false],
  ];

  test.each(overloadRangeCases)('search string %s - validity %s', (filterString, valid) =>
    expect(parseAndValidateQuery(filterString, searchConfig).valid).toBe(valid),
  );
});
