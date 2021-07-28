import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import 'cross-fetch/polyfill';
import _ from 'lodash';
import {
  elementalLightModHash,
  isArmor2Arms,
  isArmor2Chest,
  isArmor2ClassItem,
  isArmor2Helmet,
  isArmor2Legs,
} from '../../testing/test-item-utils';
import { getTestDefinitions, getTestStores } from '../../testing/test-utils';
import { ModAssignments } from './mod-assignments';
import { generateModPermutations } from './process-worker/process-utils';
import { ProcessItem, ProcessMod } from './process-worker/types';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './process/mappers';

function modifyMod({
  mod,
  hash,
  energyType,
  energyVal,
  tag,
}: {
  mod: ProcessMod;
  hash: number;
  energyType?: DestinyEnergyType;
  energyVal?: number;
  tag?: string;
}): ProcessMod {
  const newMod = _.cloneDeep(mod);
  if (hash !== undefined) {
    mod.hash = hash;
  }

  if (energyType !== undefined) {
    newMod.energy!.type = energyType;
  }

  if (energyVal !== undefined) {
    newMod.energy!.val = energyVal;
  }

  newMod.tag = tag;

  return newMod;
}

function modifyItem({
  item,
  energyType,
  originalEnergyType,
  energyVal,
  energyCapacity,
}: {
  item: ProcessItem;
  energyType?: DestinyEnergyType;
  originalEnergyType?: DestinyEnergyType;
  energyVal?: number;
  energyCapacity?: number;
}): ProcessItem {
  const newItem = _.cloneDeep(item);
  if (energyType !== undefined) {
    newItem.energy!.type = energyType;
  }

  if (originalEnergyType !== undefined) {
    newItem.energy!.originalEnergyType = originalEnergyType;
  }

  if (energyVal !== undefined) {
    newItem.energy!.val = energyVal;
  }

  if (energyCapacity !== undefined) {
    newItem.energy!.capacity = energyCapacity;
  }

  return newItem;
}

// The tsconfig in the process worker folder messes with tests so they live outside of it.
describe('mod-assignments', () => {
  let combatMod: ProcessMod;

  let helmet: ProcessItem;
  let arms: ProcessItem;
  let chest: ProcessItem;
  let legs: ProcessItem;
  let classItem: ProcessItem;

  // use these for testing as they are reset after each test
  let items: ProcessItem[];
  let combatMods: ProcessMod[];

  beforeAll(async () => {
    const [defs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    for (const store of stores) {
      for (const storeItem of store.items) {
        if (!helmet && isArmor2Helmet(storeItem)) {
          helmet = mapDimItemToProcessItem(
            defs,
            storeItem,
            UpgradeSpendTier.EnhancementPrisms,
            false
          );
        }
        if (!arms && isArmor2Arms(storeItem)) {
          arms = mapDimItemToProcessItem(
            defs,
            storeItem,
            UpgradeSpendTier.EnhancementPrisms,
            false
          );
        }
        if (!chest && isArmor2Chest(storeItem)) {
          chest = mapDimItemToProcessItem(
            defs,
            storeItem,
            UpgradeSpendTier.EnhancementPrisms,
            false
          );
        }
        if (!legs && isArmor2Legs(storeItem)) {
          legs = mapDimItemToProcessItem(
            defs,
            storeItem,
            UpgradeSpendTier.EnhancementPrisms,
            false
          );
        }
        if (!classItem && isArmor2ClassItem(storeItem)) {
          classItem = mapDimItemToProcessItem(
            defs,
            storeItem,
            UpgradeSpendTier.EnhancementPrisms,
            false
          );
        }

        if (helmet && arms && chest && legs && classItem) {
          break;
        }
      }
    }

    combatMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(elementalLightModHash) as PluggableInventoryItemDefinition
    );

    items = [helmet, arms, chest, legs, classItem];
    combatMods = [combatMod, combatMod, combatMod, combatMod, combatMod];
  });

  it('returns an assignment with a lower energy investment', () => {
    const assignments = new ModAssignments();

    const testItems = items.map((item) =>
      modifyItem({
        item,
        originalEnergyType: DestinyEnergyType.Arc,
        energyCapacity: 1,
        energyVal: 0,
      })
    );

    testItems[0].energy!.originalEnergyType = DestinyEnergyType.Thermal;
    testItems[4].energy!.originalEnergyType = DestinyEnergyType.Void;

    const testCombatMods = combatMods.map((mod, i) =>
      modifyMod({ mod, hash: i, energyType: DestinyEnergyType.Arc, energyVal: 3 })
    );

    testCombatMods[1].energy!.type = DestinyEnergyType.Void;
    testCombatMods[3].energy!.type = DestinyEnergyType.Thermal;

    const combatModPerms = generateModPermutations(testCombatMods);

    for (const mods of combatModPerms) {
      assignments.assignSlotIndependantModsIfLessEnergyTypeSwaps(testItems, [], mods, []);
    }

    const energyTypeResults = Object.values(assignments.getResults()).map(
      (modHashes) => testCombatMods.find((mod) => mod.hash === modHashes[0])?.energy?.type
    );

    for (let i = 0; i < testItems.length; i++) {
      expect(testItems[i].energy!.originalEnergyType).toBe(energyTypeResults[i]);
    }
  });
});
