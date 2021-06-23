import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import 'cross-fetch/polyfill';
import { getTestDefinitions, getTestStores } from '../../testing/test-utils';
import { UpgradeSpendTier } from './types';
import { canSwapEnergyFromUpgradeSpendTier, upgradeSpendTierToMaxEnergy } from './utils';

describe('Spend tier tests', () => {
  let defs: D2ManifestDefinitions;
  let item: DimItem;
  let exoticItem: DimItem;

  const tiers = [
    UpgradeSpendTier.AscendantShards,
    UpgradeSpendTier.AscendantShardsNotExotic,
    UpgradeSpendTier.EnhancementPrisms,
    UpgradeSpendTier.LegendaryShards,
    UpgradeSpendTier.Nothing,
  ];

  beforeAll(async () => {
    const [fetchedDefs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    defs = fetchedDefs;

    for (const store of stores) {
      for (const storeItem of store.items) {
        if (
          storeItem.energy &&
          storeItem.equippingLabel &&
          (!exoticItem || exoticItem.energy!.energyCapacity > storeItem.energy.energyCapacity)
        ) {
          exoticItem = storeItem;
        }

        if (
          storeItem.energy &&
          !storeItem.equippingLabel &&
          (!item || item.energy!.energyCapacity > storeItem.energy.energyCapacity)
        ) {
          item = storeItem;
        }
      }
    }

    console.log(
      `Testing spend tier with exotic item energy capacity ${exoticItem.energy?.energyCapacity}
        and item energy capacity ${item.energy?.energyCapacity}`
    );
  });

  const testTiersInDescendingOrder = (
    expected: number[] | boolean[],
    testFn: (tier: UpgradeSpendTier) => boolean | number
  ) => {
    for (const [index, tier] of tiers.entries()) {
      expect(testFn(tier)).toBe(expected[index]);
    }
  };

  test('a masterworked item can only be swapped with ascendant shards', () => {
    const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 10 } };

    testTiersInDescendingOrder([true, true, false, false, false], (tier: UpgradeSpendTier) =>
      canSwapEnergyFromUpgradeSpendTier(defs, tier, updatedItem)
    );
  });

  test('a masterworked exotic item can only be swapped with ascendant shards', () => {
    const updatedItem: DimItem = {
      ...exoticItem,
      energy: { ...exoticItem.energy!, energyCapacity: 10 },
    };

    testTiersInDescendingOrder([true, false, false, false, false], (tier: UpgradeSpendTier) =>
      canSwapEnergyFromUpgradeSpendTier(defs, tier, updatedItem)
    );
  });

  test('an item with 9 energy can only be swapped with enhancement prisms or higher', () => {
    const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 9 } };

    testTiersInDescendingOrder([true, true, true, false, false], (tier: UpgradeSpendTier) =>
      canSwapEnergyFromUpgradeSpendTier(defs, tier, updatedItem)
    );
  });

  test('an item with 7 energy can only be swapped with legendary shards or higher', () => {
    const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 7 } };

    testTiersInDescendingOrder([true, true, true, true, false], (tier: UpgradeSpendTier) =>
      canSwapEnergyFromUpgradeSpendTier(defs, tier, updatedItem)
    );
  });

  test('a masterworked item always has max energy of 10', () => {
    const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 10 } };

    testTiersInDescendingOrder([10, 10, 10, 10, 10], (tier: UpgradeSpendTier) =>
      upgradeSpendTierToMaxEnergy(defs, tier, updatedItem)
    );
  });

  test('a masterworked exotic item always has max energy of 10', () => {
    const updatedItem: DimItem = {
      ...exoticItem,
      energy: { ...exoticItem.energy!, energyCapacity: 10 },
    };

    testTiersInDescendingOrder([10, 10, 10, 10, 10], (tier: UpgradeSpendTier) =>
      upgradeSpendTierToMaxEnergy(defs, tier, updatedItem)
    );
  });

  test('an item with 9 energy level can only be upgraded by ascendant shards', () => {
    const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 9 } };

    testTiersInDescendingOrder([10, 10, 9, 9, 9], (tier: UpgradeSpendTier) =>
      upgradeSpendTierToMaxEnergy(defs, tier, updatedItem)
    );
  });

  test('an exotic item with 9 energy level can only be upgraded by ascendant shards', () => {
    const updatedItem: DimItem = {
      ...exoticItem,
      energy: { ...exoticItem.energy!, energyCapacity: 9 },
    };

    testTiersInDescendingOrder([10, 9, 9, 9, 9], (tier: UpgradeSpendTier) =>
      upgradeSpendTierToMaxEnergy(defs, tier, updatedItem)
    );
  });

  test('an item with 7 energy level can only be upgraded by enhancement prisms or higher', () => {
    const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 7 } };

    testTiersInDescendingOrder([10, 10, 9, 7, 7], (tier: UpgradeSpendTier) =>
      upgradeSpendTierToMaxEnergy(defs, tier, updatedItem)
    );
  });

  test('an item with 1 energy level can only be upgraded by legendary shards or higher', () => {
    const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 1 } };

    testTiersInDescendingOrder([10, 10, 9, 7, 1], (tier: UpgradeSpendTier) =>
      upgradeSpendTierToMaxEnergy(defs, tier, updatedItem)
    );
  });
});
