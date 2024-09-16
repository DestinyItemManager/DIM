import { DimItem } from 'app/inventory/item-types';
import store from 'app/store/store';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { vaultWeaponGroupingSelector, vaultWeaponGroupingSettingSelector } from './vault-grouping';

const rootState = store.getState();

describe('vaultWeaponGroupingSettingSelector', () => {
  it('returns the currently selected weapon grouping setting', () => {
    expect(vaultWeaponGroupingSettingSelector(rootState)).toBe('');
    expect(
      vaultWeaponGroupingSettingSelector({
        ...rootState,
        dimApi: {
          ...rootState.dimApi,
          settings: {
            ...rootState.dimApi.settings,
            vaultWeaponGrouping: 'typeName',
          },
        },
      }),
    ).toBe('typeName');
  });
});

describe('vaultWeaponGroupingSelector', () => {
  let firstItem: DimItem;
  let items: readonly DimItem[];

  beforeEach(async () => {
    const [, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    [firstItem] = stores.flatMap((store) => store.items);

    items = [
      {
        ...firstItem,
        typeName: 'Scout Rifle',
        itemCategoryHashes: [1],
      },
      {
        ...firstItem,
        typeName: 'Auto Rifle',
        itemCategoryHashes: [2],
      },
      {
        ...firstItem,
        typeName: undefined as unknown as string,
        itemCategoryHashes: [0 as ItemCategoryHashes],
      },
      {
        ...firstItem,
        typeName: 'Scout Rifle',
        itemCategoryHashes: [1],
      },
      {
        ...firstItem,
        typeName: 'Hand Cannon',
        itemCategoryHashes: [3],
      },
      {
        ...firstItem,
        typeName: 'Auto Rifle',
        itemCategoryHashes: [2],
      },
    ];
  });

  it('returns the items ungrouped when no grouping is selected', () => {
    const result = vaultWeaponGroupingSelector(rootState)(items);

    expect(result).toBe(items);
  });

  it('groups items by the currently selected weapon grouping', async () => {
    const result = vaultWeaponGroupingSelector({
      ...rootState,
      dimApi: {
        ...rootState.dimApi,
        settings: {
          ...rootState.dimApi.settings,
          vaultWeaponGrouping: 'typeName',
        },
      },
    })(items);

    expect(result).toEqual([
      {
        groupingValue: 'Auto Rifle',
        icon: {
          type: 'typeName',
          itemCategoryHashes: [2],
        },
        items: [
          {
            ...firstItem,
            typeName: 'Auto Rifle',
            itemCategoryHashes: [2],
          },
          {
            ...firstItem,
            typeName: 'Auto Rifle',
            itemCategoryHashes: [2],
          },
        ],
      },
      {
        groupingValue: 'Hand Cannon',
        icon: {
          type: 'typeName',
          itemCategoryHashes: [3],
        },
        items: [
          {
            ...firstItem,
            typeName: 'Hand Cannon',
            itemCategoryHashes: [3],
          },
        ],
      },
      {
        groupingValue: 'Scout Rifle',
        icon: {
          type: 'typeName',
          itemCategoryHashes: [1],
        },
        items: [
          {
            ...firstItem,
            typeName: 'Scout Rifle',
            itemCategoryHashes: [1],
          },
          {
            ...firstItem,
            typeName: 'Scout Rifle',
            itemCategoryHashes: [1],
          },
        ],
      },
      {
        groupingValue: undefined,
        icon: {
          type: 'none',
        },
        items: [
          {
            ...firstItem,
            typeName: undefined,
            itemCategoryHashes: [0],
          },
        ],
      },
    ]);
  });
});
