import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { isExoticClassItemWithPerks } from 'app/inventory/store/exotic-class-item';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { isLoadoutBuilderItem } from 'app/loadout/loadout-item-utils';
import { ModMap, categorizeArmorMods } from 'app/loadout/mod-assignment-utils';
import { count, sumBy } from 'app/utils/collections';
import { stubFalse, stubTrue } from 'app/utils/functions';
import { getArmor3TuningStat, isArtifice, itemCanBeEquippedBy } from 'app/utils/item-utils';
import {
  getExtraIntrinsicPerkHashes,
  getExtraIntrinsicPerkSockets,
  getSetBonusModSocket,
} from 'app/utils/socket-utils';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { maxBy } from 'es-toolkit';
import { elementalChargeModHash, stacksOnStacksModHash } from 'testing/test-item-utils';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { FilterInfo, filterItems } from './item-filter';
import {
  ANY_SET_BONUS,
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

  it('preserves different set identities for Any set-bonus filtering', () => {
    const source = items.find(
      (item) =>
        !item.isExotic &&
        Boolean(item.stats?.length) &&
        item.power > 0 &&
        !isArtifice(item) &&
        !getArmor3TuningStat(item) &&
        !getSetBonusModSocket(item),
    );

    if (!source?.stats) {
      throw new Error('Expected a suitable armor item for the Any set-bonus test');
    }

    const bucketHash: ArmorBucketHash = source.bucket.hash;

    const fakeSetBonus = (hash: number) =>
      ({
        hash,
        setPerks: [
          {
            requiredSetCount: 2,
            sandboxPerkHash: hash,
          },
        ],
      }) as NonNullable<DimItem['setBonus']>;

    const weaker: DimItem = {
      ...source,
      id: `${source.id}-set-a`,
      setBonus: fakeSetBonus(111111),
    };

    const stronger: DimItem = {
      ...source,
      id: `${source.id}-set-b`,
      stats: source.stats.map((stat) => ({
        ...stat,
        base: stat.base + 1,
        value: stat.value + 1,
      })),
      setBonus: fakeSetBonus(222222),
    };

    const testItems: DimItem[] = [weaker, stronger];

    // Keep one ordinary item in every other bucket to avoid empty-bucket noise.
    for (const otherBucketHash of ArmorBucketHashes) {
      if (otherBucketHash !== bucketHash) {
        const filler = items.find((item) => item.bucket.hash === otherBucketHash && !item.isExotic);

        if (!filler) {
          throw new Error(`Expected a filler item for armor bucket ${otherBucketHash}`);
        }

        testItems.push(filler);
      }
    }

    const runFilter = (setBonuses?: Parameters<typeof filterItems>[0]['setBonuses']) =>
      filterItems({
        ...defaultArgs,
        defs,
        items: testItems,
        lockedModMap: noMods.modMap,
        unassignedMods: noMods.unassignedMods,
        setBonuses,
      })[0][bucketHash];

    // Without an Any requirement, the stronger clone safely dominates the weaker one.
    expect(runFilter().map((item) => item.id)).toEqual([stronger.id]);

    // With Any 2 selected, the two set identities must remain available.
    expect(
      runFilter({ [ANY_SET_BONUS]: 2 })
        .map((item) => item.id)
        .sort(),
    ).toEqual([weaker.id, stronger.id].sort());
  });

  it('keeps Any 4 set pieces when an exotic is locked', () => {
    const targetExotic = items.find(
      (item) => item.isExotic && item.bucket.hash !== BucketHashes.ClassArmor,
    );

    if (!targetExotic) {
      throw new Error('Expected a non-class-item exotic for the Any 4 test');
    }

    const targetExoticBucketHash: ArmorBucketHash = targetExotic.bucket.hash;

    const setHash = 111111;
    const fakeSetBonus = {
      hash: setHash,
      setPerks: [
        {
          requiredSetCount: 4,
          sandboxPerkHash: setHash,
        },
      ],
    } as NonNullable<DimItem['setBonus']>;

    const testItems: DimItem[] = [targetExotic];
    const expectedSetItems = new Map<ArmorBucketHash, string>();

    for (const bucketHash of ArmorBucketHashes) {
      if (bucketHash === targetExoticBucketHash) {
        continue;
      }

      const source = items.find(
        (item) => item.bucket.hash === bucketHash && !item.isExotic && !getSetBonusModSocket(item),
      );

      if (!source) {
        throw new Error(`Expected a legendary item for armor bucket ${bucketHash}`);
      }

      const setItem: DimItem = {
        ...source,
        id: `${source.id}-any-4`,
        setBonus: fakeSetBonus,
      };

      const ordinaryItem: DimItem = {
        ...source,
        id: `${source.id}-ordinary`,
        setBonus: undefined,
      };

      testItems.push(setItem, ordinaryItem);
      expectedSetItems.set(bucketHash, setItem.id);
    }

    const [filteredItems] = filterItems({
      ...defaultArgs,
      defs,
      items: testItems,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: targetExotic.hash,
      setBonuses: { [ANY_SET_BONUS]: 4 },
    });

    expect(filteredItems[targetExoticBucketHash].map((item) => item.id)).toContain(targetExotic.id);

    for (const [bucketHash, expectedId] of expectedSetItems) {
      expect(filteredItems[bucketHash].map((item) => item.id)).toEqual([expectedId]);
    }
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

  it('ignores an exotic-only search match so multiple buckets do not force double exotics', () => {
    // Simulate a search (e.g. `tier:5`) that happens to match only exotics: a
    // filter that keeps every exotic but no legendaries. Since a set can hold
    // just one exotic, keeping several exotic-only buckets would make every
    // combination invalid, so the search should be ignored per bucket instead.
    const [filteredItems, filterInfo] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      searchFilter: (item) => item.isExotic,
    });

    noPinInvariants(filteredItems, filterInfo);
    expect(filterInfo.searchQueryEffective).toBe(false);
    // Every bucket keeps its legendaries rather than collapsing to exotics only.
    for (const bucketHash of ArmorBucketHashes) {
      expect(filteredItems[bucketHash].some((item) => !item.isExotic)).toBe(true);
    }
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
    const bucketHash: ArmorBucketHash = exotic.bucket.hash;
    expect(filteredItems[bucketHash].length).toBe(0);
  });

  it('does not filter exotic class items when no perks are specified', () => {
    const targetExotic = items.find(
      (i) => isExoticClassItemWithPerks(i.hash) && getExtraIntrinsicPerkSockets(i).length > 0,
    )!;
    const [filteredItems] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: targetExotic.hash,
    });

    const matching = items.filter((i) => i.hash === targetExotic.hash);
    expect(filteredItems[BucketHashes.ClassArmor].length).toBe(matching.length);
  });

  it('narrows exotic class items to instances having a specified perk', () => {
    const targetExotic = items.find(
      (i) => isExoticClassItemWithPerks(i.hash) && getExtraIntrinsicPerkSockets(i).length > 0,
    )!;
    const [perk] = getExtraIntrinsicPerkHashes(targetExotic);

    const [filteredItems] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: targetExotic.hash,
      perks: [perk],
    });

    const survivors = filteredItems[BucketHashes.ClassArmor];
    expect(survivors.length).toBeGreaterThan(0);
    for (const item of survivors) {
      expect(getExtraIntrinsicPerkHashes(item)).toContain(perk);
    }
  });

  it('ignores perks that do not belong to the locked exotic class item', () => {
    const targetExotic = items.find(
      (i) => isExoticClassItemWithPerks(i.hash) && getExtraIntrinsicPerkSockets(i).length > 0,
    )!;
    // Use a hash unlikely to be a real perk for this exotic.
    const [filteredItems] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: targetExotic.hash,
      perks: [1],
    });

    const matching = items.filter((i) => i.hash === targetExotic.hash);
    expect(filteredItems[BucketHashes.ClassArmor].length).toBe(matching.length);
  });

  it('does not filter by perks when the locked exotic is not a class item', () => {
    const targetExotic = items.find((i) => i.isExotic && !isExoticClassItemWithPerks(i.hash))!;
    const [filteredItems] = filterItems({
      ...defaultArgs,
      defs,
      items,
      lockedModMap: noMods.modMap,
      unassignedMods: noMods.unassignedMods,
      lockedExoticHash: targetExotic.hash,
      perks: [12345, 67890],
    });

    const matching = items.filter((i) => i.hash === targetExotic.hash);
    const bucketHash: ArmorBucketHash = targetExotic.bucket.hash;
    expect(filteredItems[bucketHash].length).toBe(matching.length);
  });
});
