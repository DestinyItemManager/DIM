import { DimLanguage } from 'app/i18n';
import { DimItem } from 'app/inventory/item-types';
import { FilterContext } from 'app/search/items/item-filter-types';
import { buildItemFiltersMap } from 'app/search/items/item-search-filter';
import { makeSearchFilterFactory } from 'app/search/search-filter';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import i18next from 'i18next';
import { setupi18n } from 'testing/test-utils';
import { addCompareItem } from './actions';
import { findSimilarArmors, findSimilarWeapons } from './compare-buttons';
import { compareNameQuery, stripAdept } from './compare-utils';
import { compare } from './reducer';

beforeAll(setupi18n);

function weapon(name: string, id = name) {
  return {
    id,
    name,
    destinyVersion: 2,
    bucket: { hash: BucketHashes.KineticWeapons, inWeapons: true },
    itemCategoryHashes: [ItemCategoryHashes.Weapon, ItemCategoryHashes.SniperRifle],
  } as DimItem;
}

function filter(query: string, language: DimLanguage = 'en') {
  return makeSearchFilterFactory(
    { filtersMap: buildItemFiltersMap(2), language, suggestions: [] },
    { language } as FilterContext,
  )(query);
}

// Synthetic names cover every current translation, including both gender alternatives.
test.each<[DimLanguage, string[]]>([
  ['en', ['Test (Adept)', 'Test (Timelost)', 'Test (Harrowed)']],
  ['de', ['Test (Meister)', 'Test (zeitverirrt)', 'Test (Gequält)']],
  ['es', ['Test (Experto)', 'Test (Perdido en el Tiempo)', 'Test (Sepulcral)']],
  ['es-mx', ['Test (Adept)', 'Test (tiempo perdido)', 'Test (Saqueado)']],
  ['fr', ['Test (expert)', 'Test (temps perdu)', 'Test (Tourmenté)']],
  ['it', ['Test (affinata)', 'Test (perduta nel tempo)', 'Test (Tormentata)']],
  ['ja', ['新・Test', 'Test (時間超越)', 'Test (苦悩)']],
  ['ko', ['Test (숙련자)', 'Test (잃어버린 시간)', 'Test (고뇌)']],
  [
    'pl',
    [
      'Test (adept)',
      'Test (zagubiony w czasie)',
      'Test (zagubiona w czasie)',
      'Test (Spustoszenie)',
    ],
  ],
  ['pt-br', ['Test (adepto)', 'Test (Retroperda)', 'Test (Sepulcral)']],
  ['ru', ['Test (адепт)', 'Test (вневременной)', 'Test (вневременная)', 'Test (Истерзанное)']],
  ['zh-chs', ['Test（专家）', 'Test（失时）', 'Test（痛苦）']],
  ['zh-cht', ['Test（精通）', 'Test（失時）', 'Test(痛苦)']],
])(
  'normalizes family queries and preserves narrow variant opening in %s',
  async (language, names) => {
    await i18next.changeLanguage(language);
    const family = ['Test', ...names].map((name) => weapon(name));
    for (const seed of family) {
      const query = compareNameQuery(seed);
      expect(family.filter(filter(query, language))).toEqual(family);
      expect(stripAdept(seed.name)).toBe('Test');
      // Name's query is generated without passing an inventory, even when the counterpart is absent.
      const buttons = findSimilarWeapons(seed);
      const nameButton = buttons.find((button) => button.buttonLabel[0] === 'Test')!;
      expect(nameButton.query).toBe(query);
      expect(buttons[0].query).toBe(`id:${seed.id}`);

      const initial = compare(undefined, addCompareItem(seed));
      expect(family.filter(filter(initial.session!.query, language))).toEqual(
        seed === family[0] ? family : [seed],
      );
      // Both common suffix spacing forms are recognized; Japanese Adept remains a prefix.
      for (const name of names) {
        expect(filter(query, language)(weapon(name.replace(' (', '(')))).toBe(true);
      }
    }
  },
);

test.each(['Adept', 'Timelost', 'Harrowed'])(
  'Name includes one or two %s copies and an ordinary copy, while opening stays narrow',
  async (marker) => {
    await i18next.changeLanguage('en');
    const ordinary = weapon('Test', 'ordinary');
    const first = weapon(`Test (${marker})`, 'first');
    const second = weapon(first.name, 'second');
    for (const family of [
      [ordinary, first],
      [ordinary, first, second],
      [first, second],
    ]) {
      const initial = compare(undefined, addCompareItem(first));
      expect(family.filter(filter(initial.session!.query))).toEqual(
        family.filter((i) => i !== ordinary),
      );
      const nameButton = findSimilarWeapons(first).find((b) => b.buttonLabel[0] === 'Test')!;
      expect(family.filter(filter(nameButton.query))).toEqual(family);
    }
  },
);

test.each(['Hush', 'PLUG ONE.1', 'A "quote" \\', 'A "double" and \'single\' \\'])(
  'quotes %s literally and keeps unrelated names separate',
  async (name) => {
    await i18next.changeLanguage('en');
    const family = [name, `${name} (Adept)`, `${name} (Timelost)`, `${name} (Harrowed)`].map((n) =>
      weapon(n),
    );
    const unrelated = ['Hushed Whisper', 'PLUG ONEX1', 'PLUG ONE.10', `${name} Extra`].map((n) =>
      weapon(n),
    );
    for (const seed of family) {
      const query = compareNameQuery(seed);
      expect([...family, ...unrelated].filter(filter(query))).toEqual(family);
    }
  },
);

test('retains clicked spelling and ignores ordinary surrounding whitespace when opening', async () => {
  await i18next.changeLanguage('en');
  const variant = weapon('Test (ADEPT)');
  expect(filter(compareNameQuery(variant))(variant)).toBe(true);
  expect(compare(undefined, addCompareItem(variant)).session?.query).toBe(
    '(exactname:"Test (ADEPT)")',
  );
  const ordinary = weapon(' Test ');
  expect(
    filter(compare(undefined, addCompareItem(ordinary)).session!.query)(weapon('Test (Adept)')),
  ).toBe(true);
});

test.each([1, 2] as const)(
  'keeps D%s armor exact and weapon variant opening narrow',
  async (destinyVersion) => {
    await i18next.changeLanguage('en');
    const variant = { ...weapon('Test (Adept)'), destinyVersion };
    expect(compare(undefined, addCompareItem(variant)).session?.query).toBe(
      '(exactname:"Test (Adept)")',
    );
    const ordinary = { ...weapon('Test'), destinyVersion };
    expect(filter(compare(undefined, addCompareItem(ordinary)).session!.query)(variant)).toBe(true);
    for (const isExotic of [false, true]) {
      const armor = {
        ...variant,
        isExotic,
        bucket: { hash: BucketHashes.Helmet, inArmor: true, inWeapons: false },
        itemCategoryHashes: [
          ItemCategoryHashes.Armor,
          ItemCategoryHashes.Titan,
          ItemCategoryHashes.Helmets,
        ],
      } as DimItem;
      expect(compareNameQuery(armor)).toBe('exactname:"Test (Adept)"');
      expect(compare(undefined, addCompareItem(armor)).session?.query).toBe(
        '(exactname:"Test (Adept)")',
      );
      expect(findSimilarArmors(armor).some((b) => b.query === compareNameQuery(armor))).toBe(true);
    }
  },
);
