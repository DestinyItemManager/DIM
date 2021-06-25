import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import 'cross-fetch/polyfill';
import {
  elementalLightModHash,
  enhancedOperatorAugmentModHash,
  isArmor2Arms,
  isArmor2Chest,
  isArmor2ClassItem,
  isArmor2Helmet,
  isArmor2Legs,
  recoveryModHash,
} from '../../testing/test-item-utils';
import { getTestDefinitions, getTestStores } from '../../testing/test-utils';
import {
  canTakeSlotIndependantMods,
  generateModPermutations,
} from './process-worker/process-utils';
import { ProcessItem, ProcessMod } from './process-worker/types';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './process/mappers';
import { UpgradeSpendTier } from './types';

// The tsconfig in the process worker folder messes with tests so they live outside of it.
describe('process-utils', () => {
  let generalMod: ProcessMod;
  let combatMod: ProcessMod;
  let raidMod: ProcessMod;

  let helmet: ProcessItem;
  let arms: ProcessItem;
  let chest: ProcessItem;
  let legs: ProcessItem;
  let classItem: ProcessItem;

  // use these for testing as they are reset after each test
  let items: ProcessItem[];
  let generalMods: ProcessMod[];
  let combatMods: ProcessMod[];
  let raidMods: ProcessMod[];

  beforeAll(async () => {
    const [defs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    for (const store of stores) {
      for (const storeItem of store.items) {
        if (!helmet && isArmor2Helmet(storeItem)) {
          helmet = mapDimItemToProcessItem(defs, storeItem, UpgradeSpendTier.EnhancementPrisms);
        }
        if (!arms && isArmor2Arms(storeItem)) {
          arms = mapDimItemToProcessItem(defs, storeItem, UpgradeSpendTier.EnhancementPrisms);
        }
        if (!chest && isArmor2Chest(storeItem)) {
          chest = mapDimItemToProcessItem(defs, storeItem, UpgradeSpendTier.EnhancementPrisms);
        }
        if (!legs && isArmor2Legs(storeItem)) {
          legs = mapDimItemToProcessItem(defs, storeItem, UpgradeSpendTier.EnhancementPrisms);
        }
        if (!classItem && isArmor2ClassItem(storeItem)) {
          classItem = mapDimItemToProcessItem(defs, storeItem, UpgradeSpendTier.EnhancementPrisms);
        }

        if (helmet && arms && chest && legs && classItem) {
          break;
        }
      }
    }

    generalMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(recoveryModHash) as PluggableInventoryItemDefinition
    );
    combatMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(elementalLightModHash) as PluggableInventoryItemDefinition
    );
    raidMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(enhancedOperatorAugmentModHash) as PluggableInventoryItemDefinition
    );

    items = [helmet, arms, chest, legs, classItem];
    generalMods = [generalMod, generalMod, generalMod, generalMod, generalMod];
    combatMods = [combatMod, combatMod, combatMod, combatMod, combatMod];
    raidMods = [raidMod, raidMod, raidMod, raidMod, raidMod];
  });

  it('generates the correct number of permutations for full unique mods', () => {
    const mods = generalMods.map((mod, i) => ({ ...mod, energy: { ...mod.energy!, val: i } }));
    expect(generateModPermutations(mods)).toHaveLength(120);
  });

  it('generates the correct number of permutations for all duplicate mods', () => {
    expect(generateModPermutations(combatMods)).toHaveLength(1);
  });

  it('generates the correct number of permutations for 3 unique mods', () => {
    const mods = raidMods.map((mod, i) => ({ ...mod, energy: { ...mod.energy!, val: i % 3 } }));
    // answer is 5!/(2!2!) = 30 as we have two repeated mods
    expect(generateModPermutations(mods)).toHaveLength(30);
  });

  it('can fit all mods when there are no mods', () => {
    expect(canTakeSlotIndependantMods([[]], [[]], [[]], items)).toBe(true);
  });

  it('can fit five general mods', () => {
    const generalModPerms = generateModPermutations(generalMods);
    expect(canTakeSlotIndependantMods(generalModPerms, [[]], [[]], items)).toBe(true);
  });
});
