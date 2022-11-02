import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { loDefaultArmorEnergyRules, MIN_LO_ITEM_ENERGY } from '../types';
import { mapDimItemToProcessItem } from './mappers';

describe('lo process mappers', () => {
  let defs: D2ManifestDefinitions;
  let classItem: DimItem;
  // void class item mod
  let perpetuationMod: PluggableInventoryItemDefinition;
  // any class item mod

  beforeAll(async () => {
    const [fetchedDefs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    defs = fetchedDefs;

    perpetuationMod = defs.InventoryItem.get(4137020505) as PluggableInventoryItemDefinition;

    for (const store of stores) {
      for (const storeItem of store.items) {
        if (storeItem.energy && storeItem.stats?.every((stat) => stat.value === 0)) {
          classItem = storeItem;
          break;
        }
      }
    }
  });

  test('mapped energy matches slot specific mods', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyType: DestinyEnergyType.Arc },
    };
    const mappedItem = mapDimItemToProcessItem({
      dimItem: modifiedItem,
      armorEnergyRules: {
        ...loDefaultArmorEnergyRules,
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
      },
      modsForSlot: [perpetuationMod],
    });

    // Use specific energy as we care about that more then the specific mod
    expect(mappedItem.energy?.type).toBe(DestinyEnergyType.Void);
  });

  test('mapped energy capacity is 10 when assumed masterwork is used', () => {
    const mappedItem = mapDimItemToProcessItem({
      dimItem: classItem,
      armorEnergyRules: {
        ...loDefaultArmorEnergyRules,
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
      },
      modsForSlot: [],
    });

    expect(mappedItem.energy?.capacity).toBe(10);
  });

  test('mapped energy capacity is the items when assumed masterwork is not used', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyCapacity: 9 },
    };
    const mappedItem = mapDimItemToProcessItem({
      dimItem: modifiedItem,
      armorEnergyRules: loDefaultArmorEnergyRules,
      modsForSlot: [],
    });

    expect(mappedItem.energy?.capacity).toBe(modifiedItem.energy?.energyCapacity);
  });

  test('mapped energy capacity defaults to MIN_LO_ITEM_ENERGY when assumed masterwork is not used and the item energy is low', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyCapacity: 2 },
    };
    const mappedItem = mapDimItemToProcessItem({
      dimItem: modifiedItem,
      armorEnergyRules: loDefaultArmorEnergyRules,
      modsForSlot: [],
    });

    expect(mappedItem.energy?.capacity).toBe(MIN_LO_ITEM_ENERGY);
  });

  test('mapped energy type is Any when energy is not locked', () => {
    const mappedItem = mapDimItemToProcessItem({
      dimItem: classItem,
      armorEnergyRules: loDefaultArmorEnergyRules,
      modsForSlot: [],
    });

    expect(mappedItem.energy?.type).toBe(DestinyEnergyType.Any);
  });

  test('mapped energy type is the items when energy is locked', () => {
    const mappedItem = mapDimItemToProcessItem({
      dimItem: classItem,
      armorEnergyRules: {
        ...loDefaultArmorEnergyRules,
        lockArmorEnergyType: LockArmorEnergyType.All,
      },
      modsForSlot: [],
    });

    expect(mappedItem.energy?.type).toBe(classItem.energy?.energyType);
  });
});
