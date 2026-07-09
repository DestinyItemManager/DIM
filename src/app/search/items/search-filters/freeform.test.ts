import { DimItem } from 'app/inventory/item-types';
import { getDisplayedItemSockets, getSocketsByIndexes } from 'app/utils/socket-utils';
import { getTestDefinitions, getTestStores, setupi18n } from 'testing/test-utils';
import { ItemFilter } from '../../filter-types';
import { makeSearchFilterFactory } from '../../search-filter';
import { FilterContext } from '../item-filter-types';
import { buildItemSearchConfig } from '../item-search-filter';
import { parsePerkColumns } from './freeform';

describe('parsePerkColumns', () => {
  const cases: [input: string, text: string, columns: number[] | undefined][] = [
    // No +col tokens: passes the value through unchanged
    ['rangefinder', 'rangefinder', undefined],
    // A single column
    ['rangefinder+col3', 'rangefinder', [3]],
    // Multiple columns keep left-to-right order regardless of how they're typed
    ['rangefinder+col3+col4', 'rangefinder', [3, 4]],
    ['rangefinder+col4+col3', 'rangefinder', [4, 3]],
    // Multi-digit column numbers
    ['frenzy+col12', 'frenzy', [12]],
    // Only trailing +colN tokens are consumed; a literal '+' in the perk text is left alone
    ['a+b', 'a+b', undefined],
    ['a+b+col3', 'a+b', [3]],
    // '+col' followed by non-digits (or not anchored at the end) is treated as text
    ['col3', 'col3', undefined],
    ['rangefinder+column3', 'rangefinder+column3', undefined],
  ];

  test.each(cases)('parsePerkColumns(%p) -> text %p, columns %p', (input, text, columns) => {
    expect(parsePerkColumns(input)).toEqual({ text, columns });
  });
});

describe('perk column filtering', () => {
  let items: DimItem[];
  let makeFilter: (query: string) => ItemFilter;

  beforeAll(async () => {
    await setupi18n();
    const [defs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    items = stores.flatMap((s) => s.items);
    const config = buildItemSearchConfig(2, 'en', {});
    const filterContext = { language: 'en', d2Definitions: defs } as unknown as FilterContext;
    makeFilter = makeSearchFilterFactory(config, filterContext);
  });

  /** Report which 1-based perk column a matching perk sits in, or undefined. */
  const perkColumnOf = (item: DimItem, test: (name: string) => boolean): number | undefined => {
    const perks = getDisplayedItemSockets(item, /* excludeEmptySockets */ true)?.perks;
    if (!perks || !item.sockets) {
      return undefined;
    }
    const perkSockets = getSocketsByIndexes(item.sockets, perks.socketIndexes);
    const idx = perkSockets.findIndex((s) =>
      s.plugOptions.some((p) => test(p.plugDef.displayProperties.name)),
    );
    return idx === -1 ? undefined : idx + 1;
  };

  const hasRangefinder = (name: string) => name.toLowerCase() === 'rangefinder';

  test('a +colN query is a subset of the plain query', () => {
    const plain = items.filter(makeFilter('perkname:rangefinder'));
    const col3 = items.filter(makeFilter('perkname:rangefinder+col3'));
    expect(plain.length).toBeGreaterThan(0);
    expect(col3.length).toBeGreaterThan(0);
    expect(col3.every((i) => plain.includes(i))).toBe(true);
  });

  test('columns partition the matches and multiple +colN tokens union them', () => {
    const plainTrait = items.filter(makeFilter('perkname:rangefinder+col3+col4'));
    const col3 = new Set(items.filter(makeFilter('perkname:rangefinder+col3')));
    const col4 = new Set(items.filter(makeFilter('perkname:rangefinder+col4')));
    // The two trait columns don't overlap...
    expect([...col3].some((i) => col4.has(i))).toBe(false);
    // ...and +col3+col4 is exactly their union.
    expect(new Set(plainTrait)).toEqual(new Set([...col3, ...col4]));
  });

  test('every +col3 match actually has the perk in its 3rd perk column', () => {
    const col3 = items.filter(makeFilter('perkname:rangefinder+col3'));
    expect(col3.length).toBeGreaterThan(0);
    for (const item of col3) {
      expect(perkColumnOf(item, hasRangefinder)).toBe(3);
    }
  });

  test('a barrel-only perk lands in column 1, never in a trait column', () => {
    const col1 = items.filter(makeFilter('perkname:"arrowhead brake"+col1'));
    const col3 = items.filter(makeFilter('perkname:"arrowhead brake"+col3'));
    expect(col1.length).toBeGreaterThan(0);
    expect(col3.length).toBe(0);
  });

  test('quoting the perk name keeps the +colN selector attached', () => {
    // Regression: a trailing +colN sits outside the closing quote, so it used to
    // be dropped and the column was ignored for quoted perk names.
    const unquoted = new Set(items.filter(makeFilter('perkname:rangefinder+col3')));
    const quoted = new Set(items.filter(makeFilter('perkname:"rangefinder"+col3')));
    expect(quoted.size).toBeGreaterThan(0);
    expect(quoted).toEqual(unquoted);
    // And it still restricts by column rather than matching every rangefinder.
    const plain = items.filter(makeFilter('perkname:"rangefinder"'));
    expect(quoted.size).toBeLessThan(plain.length);
  });

  test('a perk in no requested column matches nothing', () => {
    // Rangefinder is a trait, so it never appears in the barrel/magazine columns.
    expect(items.filter(makeFilter('perkname:rangefinder+col1')).length).toBe(0);
    expect(items.filter(makeFilter('perkname:rangefinder+col2')).length).toBe(0);
  });
});
