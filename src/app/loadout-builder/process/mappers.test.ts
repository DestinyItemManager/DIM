import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { getTestStores } from 'testing/test-utils';
import { loDefaultArmorEnergyRules, MIN_LO_ITEM_ENERGY } from '../types';
import { mapDimItemToProcessItem } from './mappers';

describe('lo process mappers', () => {
  let classItem: DimItem;

  beforeAll(async () => {
    const stores = await getTestStores();

    for (const store of stores) {
      for (const storeItem of store.items) {
        if (storeItem.energy && storeItem.stats?.every((stat) => stat.value === 0)) {
          classItem = storeItem;
          break;
        }
      }
    }
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

    expect(mappedItem.remainingEnergyCapacity).toBe(10);
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

    expect(mappedItem.remainingEnergyCapacity).toBe(modifiedItem.energy?.energyCapacity);
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

    expect(mappedItem.remainingEnergyCapacity).toBe(MIN_LO_ITEM_ENERGY);
  });
});
