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
  });

  beforeEach(() => {
    items = [
      _.cloneDeep(helmet),
      _.cloneDeep(arms),
      _.cloneDeep(chest),
      _.cloneDeep(legs),
      _.cloneDeep(classItem),
    ];
    combatMods = Array.from({ length: 5 }, (ignored) => _.cloneDeep(combatMod));
  });

  it('returns an assignment with a lower energy investment', () => {
    const assignments = new ModAssignments();

    for (const item of items) {
      item.energy!.originalEnergyType = DestinyEnergyType.Arc;
      item.energy!.capacity = 1;
      item.energy!.val = 0;
      item.energy!.type = item.energy?.originalEnergyType;
    }

    items[0].energy!.originalEnergyType = DestinyEnergyType.Thermal;
    items[0].energy!.type = DestinyEnergyType.Thermal;
    items[4].energy!.originalEnergyType = DestinyEnergyType.Void;
    items[4].energy!.type = DestinyEnergyType.Void;

    for (const [i, mod] of combatMods.entries()) {
      mod.hash = i;
      mod.energy!.type = DestinyEnergyType.Arc;
      mod.energy!.val = 3;
    }

    combatMods[1].energy!.type = DestinyEnergyType.Void;
    combatMods[3].energy!.type = DestinyEnergyType.Thermal;

    const combatModPerms = generateModPermutations(combatMods);

    for (const mods of combatModPerms) {
      assignments.assignSlotIndependantModsIfLessEnergyTypeSwaps(items, [], mods, []);
    }

    const energyTypeResults = Object.values(assignments.getResults()).map(
      (modHashes) => combatMods.find((mod) => mod.hash === modHashes[0])?.energy?.type
    );

    const expectedResults = items.map((item) => item.energy?.originalEnergyType);

    expect(energyTypeResults).toEqual(expectedResults);
  });
});
