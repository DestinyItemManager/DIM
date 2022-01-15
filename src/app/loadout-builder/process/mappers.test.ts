import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import 'cross-fetch/polyfill';
import { getTestDefinitions, getTestStores } from '../../../testing/test-utils';
import { mapDimItemToProcessItem } from './mappers';

describe('lo process mappers', () => {
  let defs: D2ManifestDefinitions;
  let classItem: DimItem;
  // void class item mod
  let perpetuationMod: PluggableInventoryItemDefinition;
  // any class item mod
  let distributionMod: PluggableInventoryItemDefinition;

  beforeAll(async () => {
    const [fetchedDefs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    defs = fetchedDefs;

    perpetuationMod = defs.InventoryItem.get(4137020505) as PluggableInventoryItemDefinition;
    distributionMod = defs.InventoryItem.get(1513970148) as PluggableInventoryItemDefinition;

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
    const mappedItem = mapDimItemToProcessItem(modifiedItem, 10, 10, false, [perpetuationMod]);

    // Use specific energy as we care about that more then the specific mod
    expect(mappedItem.energy?.type).toBe(DestinyEnergyType.Void);
  });

  test('mapped energy is Any when no slot specific mods and a high enough spend tier', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyType: DestinyEnergyType.Arc },
    };
    const mappedItem = mapDimItemToProcessItem(modifiedItem, 10, 10, false, []);

    expect(mappedItem.energy?.type).toBe(DestinyEnergyType.Any);
  });

  test('mapped energy is the items when no slot specific mods, a high enough spend tier, and lockItemEnergyType is true', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyType: DestinyEnergyType.Arc },
    };
    const mappedItem = mapDimItemToProcessItem(modifiedItem, 10, 10, true, []);

    expect(mappedItem.energy?.type).toBe(DestinyEnergyType.Arc);
  });

  test('mapped energy is Any when any slot specific mod and a high enough spend tier', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyType: DestinyEnergyType.Arc },
    };
    const mappedItem = mapDimItemToProcessItem(modifiedItem, 10, 10, false, [distributionMod]);

    expect(mappedItem.energy?.type).toBe(DestinyEnergyType.Any);
  });

  test('mapped energy is the dim items when no mods and low spend tier', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyType: DestinyEnergyType.Arc },
    };
    const mappedItem = mapDimItemToProcessItem(modifiedItem, 1, 1, false, []);

    expect(mappedItem.energy?.type).toBe(DestinyEnergyType.Arc);
  });

  test('mapped energy capacity is the dim items when no mods and low spend tier', () => {
    const energyCapacity = 7;
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyCapacity },
    };
    const mappedItem = mapDimItemToProcessItem(modifiedItem, 1, 1, false, []);

    expect(mappedItem.energy?.capacity).toBe(energyCapacity);
  });

  test('mapped energy capacity is the spend tiers when a high enough tier is used', () => {
    const energyCapacity = 7;
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyCapacity },
    };
    const mappedItem = mapDimItemToProcessItem(modifiedItem, 8, 8, false, []);

    expect(mappedItem.energy?.capacity).toBe(9);
  });

  test('mapped energy capacity is the spend tiers when a high enough tier is used', () => {
    const energyCost = 3;
    const modifiedMod: PluggableInventoryItemDefinition = {
      ...perpetuationMod,
      plug: {
        ...perpetuationMod.plug,
        energyCost: { ...perpetuationMod.plug.energyCost!, energyCost },
      },
    };
    const mods = [modifiedMod, modifiedMod];
    const mappedItem = mapDimItemToProcessItem(classItem, 8, 8, false, mods);

    expect(mappedItem.energy?.val).toBe(energyCost * mods.length);
  });
});
