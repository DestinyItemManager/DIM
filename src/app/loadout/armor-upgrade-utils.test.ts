import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory-stores/item-types';
import 'cross-fetch/polyfill';
import { getTestDefinitions, getTestStores } from '../../testing/test-utils';
import {
  canSwapEnergyFromUpgradeSpendTier,
  upgradeSpendTierToMaxEnergy,
} from './armor-upgrade-utils';

describe('Spend tier tests', () => {
  let defs: D2ManifestDefinitions;
  let item: DimItem;
  let exoticItem: DimItem;

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

  test.each([
    ['AscendantShards', true],
    ['AscendantShardsNotMasterworked', false],
    ['AscendantShardsNotExotic', false],
    ['EnhancementPrisms', false],
    ['LegendaryShards', false],
    ['Nothing', false],
  ])(
    'Upgrade spend tier %s can swap energy on a masterworked item = %p',
    (tier: string, result: boolean) => {
      const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 10 } };
      expect(
        canSwapEnergyFromUpgradeSpendTier(defs, UpgradeSpendTier[tier], updatedItem, false)
      ).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', true],
    ['AscendantShardsNotMasterworked', false],
    ['AscendantShardsNotExotic', false],
    ['EnhancementPrisms', false],
    ['LegendaryShards', false],
    ['Nothing', false],
  ])(
    'Upgrade spend tier %s can swap energy on a masterworked exotic item = %p',
    (tier: string, result: boolean) => {
      const updatedItem: DimItem = {
        ...exoticItem,
        energy: { ...exoticItem.energy!, energyCapacity: 10 },
      };
      expect(
        canSwapEnergyFromUpgradeSpendTier(defs, UpgradeSpendTier[tier], updatedItem, false)
      ).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', true],

    ['AscendantShardsNotMasterworked', true],
    ['AscendantShardsNotExotic', true],
    ['EnhancementPrisms', true],
    ['LegendaryShards', false],
    ['Nothing', false],
  ])(
    'Upgrade spend tier %s can swap energy on an item with 9 energy = %p',
    (tier: string, result: boolean) => {
      const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 9 } };
      expect(
        canSwapEnergyFromUpgradeSpendTier(defs, UpgradeSpendTier[tier], updatedItem, false)
      ).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', true],
    ['AscendantShardsNotMasterworked', true],
    ['AscendantShardsNotExotic', true],
    ['EnhancementPrisms', true],
    ['LegendaryShards', true],
    ['Nothing', false],
  ])(
    'Upgrade spend tier %s can swap energy on an item with 7 energy = %p',
    (tier: string, result: boolean) => {
      const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 7 } };
      expect(
        canSwapEnergyFromUpgradeSpendTier(defs, UpgradeSpendTier[tier], updatedItem, false)
      ).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', 10],
    ['AscendantShardsNotMasterworked', 10],
    ['AscendantShardsNotExotic', 10],
    ['EnhancementPrisms', 10],
    ['LegendaryShards', 10],
    ['Nothing', 10],
  ])(
    'Upgrade spend tier %s upgrades a materworked item to %i energy;',
    (tier: string, result: number) => {
      const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 10 } };
      expect(upgradeSpendTierToMaxEnergy(defs, UpgradeSpendTier[tier], updatedItem)).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', 10],
    ['AscendantShardsNotMasterworked', 10],
    ['AscendantShardsNotExotic', 10],
    ['EnhancementPrisms', 10],
    ['LegendaryShards', 10],
    ['Nothing', 10],
  ])(
    'Upgrade spend tier %s upgrades a materworked exotic item to %i energy;',
    (tier: string, result: number) => {
      const updatedItem: DimItem = {
        ...exoticItem,
        energy: { ...exoticItem.energy!, energyCapacity: 10 },
      };
      expect(upgradeSpendTierToMaxEnergy(defs, UpgradeSpendTier[tier], updatedItem)).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', 10],
    ['AscendantShardsNotMasterworked', 10],
    ['AscendantShardsNotExotic', 10],
    ['EnhancementPrisms', 9],
    ['LegendaryShards', 9],
    ['Nothing', 9],
  ])(
    'Upgrade spend tier %s upgrades an item with 9 energy to %i energy;',
    (tier: string, result: number) => {
      const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 9 } };
      expect(upgradeSpendTierToMaxEnergy(defs, UpgradeSpendTier[tier], updatedItem)).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', 10],
    ['AscendantShardsNotMasterworked', 10],
    ['AscendantShardsNotExotic', 9],
    ['EnhancementPrisms', 9],
    ['LegendaryShards', 9],
    ['Nothing', 9],
  ])(
    'Upgrade spend tier %s upgrades an exotic item with 9 energy to %i energy;',
    (tier: string, result: number) => {
      const updatedItem: DimItem = {
        ...exoticItem,
        energy: { ...exoticItem.energy!, energyCapacity: 9 },
      };
      expect(upgradeSpendTierToMaxEnergy(defs, UpgradeSpendTier[tier], updatedItem)).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', 10],
    ['AscendantShardsNotMasterworked', 10],
    ['AscendantShardsNotExotic', 10],
    ['EnhancementPrisms', 9],
    ['LegendaryShards', 7],
    ['Nothing', 7],
  ])(
    'Upgrade spend tier %s upgrades an item with 7 energy to %i energy;',
    (tier: string, result: number) => {
      const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 7 } };
      expect(upgradeSpendTierToMaxEnergy(defs, UpgradeSpendTier[tier], updatedItem)).toBe(result);
    }
  );

  test.each([
    ['AscendantShards', 10],
    ['AscendantShardsNotMasterworked', 10],
    ['AscendantShardsNotExotic', 10],
    ['EnhancementPrisms', 9],
    ['LegendaryShards', 7],
    ['Nothing', 1],
  ])(
    'Upgrade spend tier %s upgrades an item with 1 energy to %i energy;',
    (tier: string, result: number) => {
      const updatedItem: DimItem = { ...item, energy: { ...item.energy!, energyCapacity: 1 } };
      expect(upgradeSpendTierToMaxEnergy(defs, UpgradeSpendTier[tier], updatedItem)).toBe(result);
    }
  );
});
