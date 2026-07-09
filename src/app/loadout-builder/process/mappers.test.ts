import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { armorStats } from 'app/search/d2-known-values';
import { getArmor3TuningSocket } from 'app/utils/socket-utils';
import { getTestStores } from 'testing/test-utils';
import { loDefaultArmorEnergyRules, MIN_LO_ITEM_ENERGY } from '../types';
import { mapDimItemToProcessItems } from './mappers';

describe('lo process mappers', () => {
  let classItem: DimItem;
  let exoticTuningItem: DimItem | undefined;
  let legendaryTuningItem: DimItem | undefined;

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

    const armor = stores.flatMap((store) => store.items).filter((item) => item.bucket.inArmor);
    exoticTuningItem = armor.find((item) => item.isExotic && getArmor3TuningSocket(item));
    legendaryTuningItem = armor.find((item) => !item.isExotic && getArmor3TuningSocket(item));
  });

  test('mapped energy capacity is 10 when assumed masterwork is used', () => {
    const mappedItem = mapDimItemToProcessItems({
      dimItem: classItem,
      armorEnergyRules: {
        ...loDefaultArmorEnergyRules,
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
      },
      modsForSlot: [],
      desiredStatRanges: [],
      autoStatMods: true,
    })[0];

    expect(mappedItem.remainingEnergyCapacity).toBe(10);
  });

  test('mapped energy capacity is the items when assumed masterwork is not used', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyCapacity: 9 },
    };
    const mappedItem = mapDimItemToProcessItems({
      dimItem: modifiedItem,
      armorEnergyRules: loDefaultArmorEnergyRules,
      modsForSlot: [],
      desiredStatRanges: [],
      autoStatMods: true,
    })[0];

    expect(mappedItem.remainingEnergyCapacity).toBe(modifiedItem.energy?.energyCapacity);
  });

  test('mapped energy capacity defaults to MIN_LO_ITEM_ENERGY when assumed masterwork is not used and the item energy is low', () => {
    const modifiedItem: DimItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyCapacity: 2 },
    };
    const mappedItem = mapDimItemToProcessItems({
      dimItem: modifiedItem,
      armorEnergyRules: loDefaultArmorEnergyRules,
      modsForSlot: [],
      desiredStatRanges: [],
      autoStatMods: true,
    })[0];

    expect(mappedItem.remainingEnergyCapacity).toBe(MIN_LO_ITEM_ENERGY);
  });

  test('a tuning-capable exotic maps to a single item with tuning variants attached', () => {
    if (!exoticTuningItem) {
      return; // no tuning-capable exotic in the test data
    }
    const mappedItems = mapDimItemToProcessItems({
      dimItem: exoticTuningItem,
      armorEnergyRules: loDefaultArmorEnergyRules,
      modsForSlot: [],
      desiredStatRanges: armorStats.map((statHash) => ({ statHash, minStat: 0, maxStat: 200 })),
      autoStatMods: true,
    });

    expect(mappedItems).toHaveLength(1);
    const [mappedItem] = mappedItems;
    expect(mappedItem.includedTuningMod).toBeUndefined();
    expect(mappedItem.tuningVariants!.length).toBeGreaterThan(0);
    const socketPlugs = getArmor3TuningSocket(exoticTuningItem)!.reusablePlugItems!.map(
      (p) => p.plugItemHash,
    );
    for (const variant of mappedItem.tuningVariants!) {
      expect(socketPlugs).toContain(variant.modHash);
    }
    // The variants carry the item's stats as tuned by each mod
    expect(
      mappedItem.tuningVariants!.some(
        (variant) =>
          !armorStats.every((statHash) => variant.stats[statHash] === mappedItem.stats[statHash]),
      ),
    ).toBe(true);
  });

  test('a tuning-capable legendary still expands into one item per tuning mod', () => {
    if (!legendaryTuningItem) {
      return; // no tuning-capable legendary in the test data
    }
    const mappedItems = mapDimItemToProcessItems({
      dimItem: legendaryTuningItem,
      armorEnergyRules: loDefaultArmorEnergyRules,
      modsForSlot: [],
      desiredStatRanges: armorStats.map((statHash) => ({ statHash, minStat: 0, maxStat: 200 })),
      autoStatMods: true,
    });

    expect(mappedItems.length).toBeGreaterThan(0);
    for (const mappedItem of mappedItems) {
      expect(mappedItem.includedTuningMod).toBeDefined();
      expect(mappedItem.tuningVariants).toBeUndefined();
    }
  });
});
