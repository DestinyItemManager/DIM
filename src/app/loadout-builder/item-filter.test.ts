import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { isLoadoutBuilderItem } from 'app/loadout/loadout-item-utils';
import { ModMap, categorizeArmorMods } from 'app/loadout/mod-assignment-utils';
import { count, sumBy } from 'app/utils/collections';
import { stubFalse, stubTrue } from 'app/utils/functions';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { maxBy } from 'es-toolkit';
import { elementalChargeModHash, stacksOnStacksModHash } from 'testing/test-item-utils';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { FilterInfo, filterItems } from './item-filter';
import {
  ArmorBucketHash,
  ArmorBucketHashes,
  ArmorEnergyRules,
  ItemsByBucket,
  LOCKED_EXOTIC_ANY_EXOTIC,
  LOCKED_EXOTIC_NO_EXOTIC,
  loDefaultArmorEnergyRules,
} from './types';

function expectItemCount(filterInfo: FilterInfo, expectedCount: number) {
  expect(
    sumBy(Object.values(filterInfo.perBucketStats), (s) => s.finalValid + s.removedStrictlyWorse),
  ).toBe(expectedCount);
}

describe('loadout-builder item-filter', () => {
  let defs: D2ManifestDefinitions;
  let store: DimStore;
  let items: DimItem[];
  let stacksOnStacksMod: PluggableInventoryItemDefinition;
  let elementalChargeMod: PluggableInventoryItemDefinition;

  const defaultArgs = {
    lockedExoticHash: undefined,
    excludedItems: {},
    pinnedItems: {},
    searchFilter: stubTrue,
    armorEnergyRules: loDefaultArmorEnergyRules,
  } satisfies Partial<Parameters<typeof filterItems>[0]>;

  let noMods: { modMap: ModMap; unassignedMods: PluggableInventoryItemDefinition[] };

  beforeAll(async () => {
    let stores: DimStore[];
    [defs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    const allItems = stores.flatMap((store) => store.items);
    const isValidItem = (store: DimStore, item: DimItem) =>
      itemCanBeEquippedBy(item, store) && isLoadoutBuilderItem(item) && item.rarity !== 'Rare';
    store = maxBy(stores, (store) => count(allItems, (item) => isValidItem(store, item)))!;
    items = allItems.filter((item) => isValidItem(store, item));
    noMods = categorizeArmorMods([], items);

    stacksOnStacksMod = defs.InventoryItem.get(
      stacksOnStacksModHash,
    ) as PluggableInventoryItemDefinition;
    expect(isPluggableItem(stacksOnStacksMod)).toBe(true);
    expect(stacksOnStacksMod.plug.energyCost!.energyCost).toBe(4);
    expect(stacksOnStacksMod.plug.plugCategoryHash).toBe(PlugCategoryHashes.EnhancementsV2Legs);

    elementalChargeMod = defs.InventoryItem.get(
      elementalChargeModHash,
    ) as PluggableInventoryItemDefinition;
    expect(isPluggableItem(elementalChargeMod)).toBe(true);
    expect(elementalChargeMod.plug.energyCost!.energyCost).toBe(3);
    expect(elementalChargeMod.plug.plugCategoryHash).toBe(PlugCategoryHashes.EnhancementsV2Legs);
  });

  function noPinInvariants(filteredItems: ItemsByBucket, filterInfo: FilterInfo) {
    let numItems = 0;
    for (const bucketHash of ArmorBucketHashes) {
      const originalItems = items.filter((i) => i.bucket.hash === bucketHash);
      const originalNum = originalItems.length;
      const filteredNum = filteredItems[bucketHash].length;
      const removedNum =
        filterInfo.perBucketStats[bucketHash].cantFitMods +
        filterInfo.perBucketStats[bucketHash].removedBySearchFilter +
        filterInfo.perBucketStats[bucketHash].removedStrictlyWorse;
      const numConsidered = filterInfo.perBucketStats[bucketHash].totalConsidered;

      expect(numConsidered).toBe(originalNum);
      expect(originalNum - removedNum).toBe(filteredNum);
      numItems += numConsidered;
    }
    expect(numItems).toBe(items.length);
  }

  function pinInvariants(filteredItems: ItemsByBucket, filterInfo: FilterInfo) {
    for (const bucketHash of ArmorBucketHashes) {
      const filteredNum = filteredItems[bucketHash].length;
      const removedNum =
        filterInfo.perBucketStats[bucketHash].cantFitMods +
        filterInfo.perBucketStats[bucketHash].removedBySearchFilter +
        filterInfo.perBucketStats[bucketHash].removedStrictlyWorse;
      const numConsidered = filterInfo.perBucketStats[bucketHash].totalConsidered;

      expect(numConsidered - removedNum).toBe(filteredNum);
    }
  }

  it('filters nothing out when no filters specified', () => {
    const [_filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
    });

    expectItemCount(filterInfo, items.length);
  });

  it('filters out items with insufficient energy capacity', () => {
    const { modMap, unassignedMods } = categorizeArmorMods(
      // 10 cost
      [stacksOnStacksMod, elementalChargeMod, elementalChargeMod],
      items,
    );

    expect(unassignedMods.length).toBe(0);

    const cases: [rules: ArmorEnergyRules, expectAllItemsFit: boolean][] = [
      [loDefaultArmorEnergyRules, false],
      [
        {
          ...loDefaultArmorEnergyRules,
          assumeArmorMasterwork: AssumeArmorMasterwork.All,
        },
        true,
      ],
    ];

    for (const [rules, expectAllItemsFit] of cases) {
      const [filteredItems, filterInfo] = filterItems({
        ...defaultArgs,
        defs,
        items,
        lockedModMap: modMap,
        unassignedMods,
        armorEnergyRules: rules,
      });
      noPinInvariants(filteredItems, filterInfo);
      for (const bucketHash of ArmorBucketHashes) {
        const removedNum = filterInfo.perBucketStats[bucketHash].cantFitMods;

        if (bucketHash === BucketHashes.LegArmor) {
          if (expectAllItemsFit) {
            expect(removedNum).toBe(0);
          } else {
            for (const item of filteredItems[bucketHash]) {
              expect(item.energy?.energyCapacity).toBeGreaterThanOrEqual(9);
            }
          }
        } else {
          expect(removedNum).toBe(0);
        }
      }
    }
  });

  it('filters nothing out when any exotic', () => {
    const [_filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: LOCKED_EXOTIC_ANY_EXOTIC,
    });

    expectItemCount(filterInfo, items.length);
  });

  it('removes exotics when no exotic', () => {
    const [filteredItems] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: LOCKED_EXOTIC_NO_EXOTIC,
    });

    for (const item of Object.values(filteredItems).flat()) {
      expect(item.isExotic).toBe(false);
    }
  });

  it('filters nothing out when infeasible filter', () => {
    const [_filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      searchFilter: stubFalse,
    });

    expectItemCount(filterInfo, items.length);
    expect(filterInfo.searchQueryEffective).toBe(false);
  });

  it('ignores filter for certain slots', () => {
    const [_filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      searchFilter: (item) => item.bucket.hash === BucketHashes.Helmet,
    });

    expectItemCount(filterInfo, items.length);
    expect(filterInfo.searchQueryEffective).toBe(false);
  });

  it('filter applies to some slots', () => {
    const [filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      searchFilter: (item) =>
        (item.bucket.hash !== BucketHashes.Helmet && item.bucket.hash !== BucketHashes.Gauntlets) ||
        // How to certainly filter some items?
        item.hash % 2 === 0,
    });

    noPinInvariants(filteredItems, filterInfo);
    expect(filterInfo.searchQueryEffective).toBe(true);
    expect(
      count(Object.values(filterInfo.perBucketStats), (stat) =>
        Boolean(stat.removedBySearchFilter),
      ),
    ).toBe(2);
  });

  it('specific exotic filtered', () => {
    const targetExotic = items.find((item) => item.isExotic)!;
    const [filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: targetExotic.hash,
    });

    pinInvariants(filteredItems, filterInfo);
    for (const bucketHash of ArmorBucketHashes) {
      if (bucketHash === targetExotic.bucket.hash) {
        for (const item of filteredItems[bucketHash]) {
          expect(item.hash).toBe(targetExotic.hash);
        }
      } else {
        for (const item of filteredItems[bucketHash]) {
          expect(item.isExotic).toBe(false);
        }
      }
    }
  });

  it('any exotic does not ignore filters if they can be satisfied', () => {
    const [filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: LOCKED_EXOTIC_ANY_EXOTIC,
      searchFilter: (item) =>
        item.rarity === 'Legendary' || item.bucket.hash === BucketHashes.Helmet,
    });

    noPinInvariants(filteredItems, filterInfo);
    for (const item of Object.values(filteredItems).flat()) {
      expect(!item.isExotic || item.bucket.hash === BucketHashes.Helmet).toBe(true);
    }
  });

  it('any exotic ignores filters if they cannot be satisfied', () => {
    const [filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: LOCKED_EXOTIC_ANY_EXOTIC,
      searchFilter: (item) => item.rarity === 'Legendary',
    });

    noPinInvariants(filteredItems, filterInfo);
    const originalExotics = items.filter((i) => i.isExotic);
    const filteredExotics = Object.values(filteredItems)
      .flat()
      .filter((i) => i.isExotic);
    expect(originalExotics.length).toBe(filteredExotics.length);
  });

  it('mod assignment may cause exotic slot to not have options', () => {
    // Find a leg armor exotic where every copy does not have 10 energy
    const exotic = items.find(
      (i) =>
        i.isExotic &&
        i.bucket.hash === BucketHashes.LegArmor &&
        items.every(
          (otherItem) => otherItem.hash !== i.hash || otherItem.energy!.energyCapacity < 10,
        ),
    )!;

    const { modMap, unassignedMods } = categorizeArmorMods(
      // 10 cost
      [stacksOnStacksMod, elementalChargeMod, elementalChargeMod],
      items,
    );
    expect(unassignedMods.length).toBe(0);

    const [filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: modMap,
      unassignedMods: unassignedMods,
      lockedExoticHash: exotic.hash,
    });

    pinInvariants(filteredItems, filterInfo);
    expect(filteredItems[exotic.bucket.hash as ArmorBucketHash].length).toBe(0);
  });
});
