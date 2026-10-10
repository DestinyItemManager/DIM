import { cleanup, fireEvent, render } from '@testing-library/react';
import { DimLanguage } from 'app/i18n';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import appStore from 'app/store/store';
import { RootState } from 'app/store/types';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import i18next from 'i18next';
import { Provider } from 'react-redux';
import { jsx } from 'react/jsx-runtime';
import { legacy_createStore } from 'redux';
import { setupi18n } from 'testing/test-utils';
import CompareSuggestions from './CompareSuggestions';
import { addCompareItem, updateCompareQuery } from './actions';
import { compareNameQuery } from './compare-utils';
import { CompareAction, compare as compareReducer } from './reducer';
import { compareItemsSelector } from './selectors';

beforeAll(setupi18n);
afterEach(cleanup);

function weapon(name: string, id: string | number): DimItem {
  return {
    id: String(id),
    name,
    destinyVersion: 2,
    bucket: {
      hash: BucketHashes.KineticWeapons,
      name: 'Kinetic',
      inWeapons: true,
      inArmor: false,
    },
    itemCategoryHashes: [ItemCategoryHashes.Weapon, ItemCategoryHashes.SniperRifle],
    typeName: 'Sniper Rifle',
  } as DimItem;
}

function compare(items: DimItem[], seed: DimItem, language: DimLanguage = 'en') {
  const initialState = appStore.getState();
  const character: Partial<DimStore> = { id: 'character', current: true, items };
  const store = legacy_createStore(
    (state: RootState = initialState, action: CompareAction) => ({
      ...state,
      compare: compareReducer(state.compare, action),
    }),
    {
      ...initialState,
      dimApi: {
        ...initialState.dimApi,
        settings: { ...initialState.dimApi.settings, language },
      },
      inventory: {
        ...initialState.inventory,
        stores: [character as DimStore],
      },
    },
  );
  store.dispatch(addCompareItem(seed));
  const view = render(
    jsx(Provider, {
      store,
      children: jsx(CompareSuggestions, {
        exampleItem: seed,
        onQueryChanged: (query: string) => store.dispatch(updateCompareQuery(query)),
      }),
    }),
  );
  return { ...view, items: () => compareItemsSelector.selector(store.getState(), undefined) };
}

test.each(['Adept', 'Timelost', 'Harrowed'])(
  '%s initial Compare stays variant-only and Name expands one or two copies',
  async (marker) => {
    await i18next.changeLanguage('en');
    const ordinary = weapon('Test', 'ordinary');
    const first = weapon(`Test (${marker})`, 'first');
    const second = weapon(first.name, 'second');
    for (const variants of [[first], [first, second]]) {
      const family = [ordinary, ...variants];
      const view = compare(family, first);
      expect(view.items()).toEqual(variants);
      const nameButton = view.getByRole('button', { name: `Test (${family.length})` });
      expect(nameButton.classList.contains('selected')).toBe(false);
      fireEvent.click(nameButton);
      expect(view.items()).toEqual(family);
      expect(nameButton.classList.contains('selected')).toBe(true);
      view.unmount();
    }
  },
);

test.each(['Adept', 'Timelost', 'Harrowed'])(
  'Name stays visible with two %s copies and no ordinary copy',
  async (marker) => {
    await i18next.changeLanguage('en');
    const family = [weapon(`Test (${marker})`, 'first'), weapon(`Test (${marker})`, 'second')];
    const view = compare(family, family[0]);
    expect(view.items()).toEqual(family);
    const nameButton = view.getByRole('button', { name: 'Test (2)' });
    fireEvent.click(nameButton);
    expect(view.items()).toEqual(family);
    expect(nameButton.classList.contains('selected')).toBe(true);
  },
);

test('ordinary initial Compare includes variants and Name expands every recognized seed', async () => {
  await i18next.changeLanguage('en');
  const family = ['Test', 'Test (Adept)', 'Test (Timelost)', 'Test (Harrowed)'].map(weapon);
  for (const seed of family) {
    const view = compare(family, seed);
    expect(view.items()).toEqual(seed === family[0] ? family : [seed]);
    const nameButton = view.getByRole('button', { name: 'Test (4)' });
    fireEvent.click(nameButton);
    expect(view.items()).toEqual(family);
    expect(nameButton.classList.contains('selected')).toBe(true);
    view.unmount();
  }
});

// Synthetic names exercise DIM's translations, including prefixes, spacing and regex alternatives.
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
])('Name finds actual localized family names from every seed in %s', async (language, names) => {
  await i18next.changeLanguage(language);
  const family = ['Test', ...names].map(weapon);
  for (const seed of family) {
    const view = compare(family, seed, language);
    if (seed !== family[0]) {
      expect(view.items()).toEqual([seed]);
    }
    const nameButton = view.getByRole('button', { name: `Test (${family.length})` });
    fireEvent.click(nameButton);
    expect(view.items()).toEqual(family);
    expect(nameButton.classList.contains('selected')).toBe(true);
    view.unmount();
  }
});

test.each(['Hush', 'PLUG ONE.1', 'A "quote" \\'])(
  'Name quotes %s literally, excludes unrelated names and counts copies once',
  async (name) => {
    await i18next.changeLanguage('en');
    const family = [weapon(name, 'ordinary'), weapon(`${name} (Adept)`, 'first')];
    const copy = weapon(family[1].name, 'second');
    family.push(copy);
    const otherType = {
      ...weapon(name, 'other-type'),
      itemCategoryHashes: [ItemCategoryHashes.Weapon, ItemCategoryHashes.AutoRifle],
    };
    const unrelated = ['Hushed Whisper', 'PLUG ONEX1', 'PLUG ONE.10', `${name} Extra`].map(weapon);
    const view = compare([...family, ...unrelated, otherType], family[1]);
    expect(view.items()).toEqual([family[1], copy]);
    const nameButton = view.getByRole('button', { name: `${name} (3)` });
    fireEvent.click(nameButton);
    expect(view.items()).toEqual(family);
    expect(nameButton.title.match(/exactname:/g)).toHaveLength(2);
  },
);

test('keeps nonweapon name comparisons exact', async () => {
  await i18next.changeLanguage('en');
  const armor = { name: 'Test (Adept)', bucket: { inWeapons: false } } as DimItem;
  expect(compareNameQuery(armor)).toBe('exactname:"Test (Adept)"');
});
