import { DimLanguage } from 'app/i18n';
import { DimItem } from 'app/inventory/item-types';
import { FilterContext } from 'app/search/items/item-filter-types';
import { buildItemFiltersMap } from 'app/search/items/item-search-filter';
import { makeSearchFilterFactory } from 'app/search/search-filter';
import i18next from 'i18next';
import { setupi18n } from 'testing/test-utils';
import { compareNameQuery } from './compare-utils';

beforeAll(setupi18n);

function item(name: string, inWeapons = true) {
  return { name, bucket: { inWeapons } } as DimItem;
}

function filter(query: string, language: DimLanguage = 'en') {
  return makeSearchFilterFactory(
    { filtersMap: buildItemFiltersMap(2), language, suggestions: [] },
    { language } as FilterContext,
  )(query);
}

test.each<[DimLanguage, string, string]>([
  ['en', 'PLUG ONE.1', 'PLUG ONE.1 (Adept)'],
  ['ja', 'テスト', '新・テスト'],
  ['pl', 'Test', 'Test (zagubiona w czasie)'],
  ['ru', 'Тест', 'Тест (вневременная)'],
  ['zh-chs', '测试', '测试（专家）'],
])('retains the clicked variant and includes its base in %s', async (language, base, variant) => {
  await i18next.changeLanguage(language);
  const pair = [item(base), item(variant)];
  expect(pair.filter(filter(compareNameQuery(pair[1]), language))).toEqual(pair);
});

test('compares ordinary, Adept, Timelost, and Harrowed weapons in both directions', async () => {
  await i18next.changeLanguage('en');
  const family = [
    'PLUG ONE.1',
    'PLUG ONE.1 (Adept)',
    'PLUG ONE.1 (Timelost)',
    'PLUG ONE.1 (Harrowed)',
  ].map((name) => item(name));
  for (const seed of family) {
    expect(family.filter(filter(compareNameQuery(seed)))).toEqual(family);
  }
});

test('matches complete weapon names literally', async () => {
  await i18next.changeLanguage('en');
  const names = [
    'Hush',
    'Hushed Whisper',
    'PLUG ONE.1',
    'PLUG ONEX1',
    'PLUG ONE.10',
    'A "quote" \\',
  ];
  const weapons = names.map((name) => item(name));
  for (const seed of weapons) {
    const matches = filter(compareNameQuery(seed));
    expect(weapons.filter(matches)).toEqual([seed]);
    expect(matches(item(`${seed.name} (Adept)`))).toBe(true);
  }
});

test('preserves exactname and nonweapon comparisons', async () => {
  await i18next.changeLanguage('en');
  const ordinary = item('Test');
  const adept = item('Test (Adept)');
  expect([ordinary, adept].filter(filter('exactname:Test'))).toEqual([ordinary]);
  const armor = item('Test (Adept)', false);
  expect(compareNameQuery(armor)).toBe('exactname:"Test (Adept)"');
  expect([armor, item('Test', false)].filter(filter(compareNameQuery(armor)))).toEqual([armor]);
});
