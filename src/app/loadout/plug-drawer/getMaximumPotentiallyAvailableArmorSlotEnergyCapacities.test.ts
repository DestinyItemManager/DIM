import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { BucketHashes } from 'data/d2/generated-enums';
import {
  elementalChargeModHash,
  enhancedOperatorAugmentModHash,
  recoveryModHash,
} from 'testing/test-item-utils';
import { getTestDefinitions } from 'testing/test-utils';
import { getAvailableArmorSlotEnergyCapacities } from '../getMaximumPotentiallyAvailableArmorSlotEnergyCapacities';

describe('filterRedundantStatModCombos', () => {
  let defs: D2ManifestDefinitions;
  let recoveryMod: PluggableInventoryItemDefinition; // General Stat Mod
  let elementalChargeMod: PluggableInventoryItemDefinition; // Helmet Mod
  let enhancedOperatorAugmentMod: PluggableInventoryItemDefinition; // Raid Mod

  beforeAll(async () => {
    defs = await getTestDefinitions();
    recoveryMod = defs.InventoryItem.get(recoveryModHash) as PluggableInventoryItemDefinition;
    enhancedOperatorAugmentMod = defs.InventoryItem.get(
      enhancedOperatorAugmentModHash,
    ) as PluggableInventoryItemDefinition;
    elementalChargeMod = defs.InventoryItem.get(
      elementalChargeModHash,
    ) as PluggableInventoryItemDefinition;
  });

  it('returns all 10s with no mods', () => {
    const res = getAvailableArmorSlotEnergyCapacities([]);
    expect(res).not.toBeNull();
    expect(Object.values(res!).every((value) => value === 10)).toBe(true);
  });
  it('returns all 10s with one recoveryMod', () => {
    const res = getAvailableArmorSlotEnergyCapacities([recoveryMod], true);
    expect(res).not.toBeNull();
    expect(Object.values(res!).every((value) => value === 10)).toBe(true);
  });
  it("returns all 6's with 5 recoveryMods", () => {
    const res = getAvailableArmorSlotEnergyCapacities([
      recoveryMod,
      recoveryMod,
      recoveryMod,
      recoveryMod,
      recoveryMod,
    ]);
    expect(res).not.toBeNull();
    expect(Object.values(res!).every((value) => value === 6)).toBe(true);
  });
  it('returns null with 5 recoveryMods and 3 elementalChargeMods', () => {
    const res = getAvailableArmorSlotEnergyCapacities([
      recoveryMod,
      recoveryMod,
      recoveryMod,
      recoveryMod,
      recoveryMod,
      elementalChargeMod,
      elementalChargeMod,
      elementalChargeMod,
    ]);
    expect(res).toBeNull();
  });
  it('returns properly with 5 recoveryMods, 2 elementalChargeMods, and 4 enhancedOperatorAugmentMods', () => {
    const res = getAvailableArmorSlotEnergyCapacities([
      recoveryMod,
      recoveryMod,
      recoveryMod,
      recoveryMod,
      recoveryMod,
      elementalChargeMod,
      elementalChargeMod,
      enhancedOperatorAugmentMod,
      enhancedOperatorAugmentMod,
      enhancedOperatorAugmentMod,
      enhancedOperatorAugmentMod,
    ]);
    expect(res).not.toBeNull();
    expect(res![BucketHashes.Helmet]).toBe(5);
    expect(res![BucketHashes.Gauntlets]).toBe(5);
    expect(res![BucketHashes.ChestArmor]).toBe(5);
    expect(res![BucketHashes.LegArmor]).toBe(0);
    expect(res![BucketHashes.ClassArmor]).toBe(5);
  });
});
