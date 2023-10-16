import { DimItem } from 'app/inventory/item-types';
import store from 'app/store/store';
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
      })
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
      },
      {
        ...firstItem,
        typeName: 'Auto Rifle',
      },
      {
        ...firstItem,
        typeName: undefined as any,
      },
      {
        ...firstItem,
        typeName: 'Scout Rifle',
      },
      {
        ...firstItem,
        typeName: 'Hand Cannon',
      },
      {
        ...firstItem,
        typeName: 'Auto Rifle',
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
        value: 'Auto Rifle',
        items: [
          {
            ...firstItem,
            typeName: 'Auto Rifle',
          },
          {
            ...firstItem,
            typeName: 'Auto Rifle',
          },
        ],
      },
      {
        value: 'Hand Cannon',
        items: [
          {
            ...firstItem,
            typeName: 'Hand Cannon',
          },
        ],
      },
      {
        value: 'Scout Rifle',
        items: [
          {
            ...firstItem,
            typeName: 'Scout Rifle',
          },
          {
            ...firstItem,
            typeName: 'Scout Rifle',
          },
        ],
      },
      {
        value: undefined,
        items: [
          {
            ...firstItem,
            typeName: undefined,
          },
        ],
      },
    ]);
  });
});
