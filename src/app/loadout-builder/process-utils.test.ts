import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import 'cross-fetch/polyfill';
import _ from 'lodash';
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
  canTakeSlotIndependentMods,
  generateProcessModPermutations,
} from './process-worker/process-utils';
import { ProcessItem, ProcessMod } from './process-worker/types';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './process/mappers';

function modifyMod({
  mod,
  energyType,
  energyVal,
  tag,
}: {
  mod: ProcessMod;
  energyType?: DestinyEnergyType;
  energyVal?: number;
  tag?: string;
}) {
  const newMod = _.cloneDeep(mod);
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
  energyVal,
  compatibleModSeasons,
}: {
  item: ProcessItem;
  energyType?: DestinyEnergyType;
  energyVal?: number;
  compatibleModSeasons?: string[];
}) {
  const newItem = _.cloneDeep(item);
  if (energyType !== undefined) {
    newItem.energy!.type = energyType;
  }

  if (energyVal !== undefined) {
    newItem.energy!.val = energyVal;
  }

  if (compatibleModSeasons !== undefined) {
    newItem.compatibleModSeasons = compatibleModSeasons;
  }

  return newItem;
}

// The tsconfig in the process worker folder messes with tests so they live outside of it.
describe('process-utils', () => {
  let generalMod: ProcessMod;
  let combatMod: ProcessMod;
  let activityMod: ProcessMod;

  let helmet: ProcessItem;
  let arms: ProcessItem;
  let chest: ProcessItem;
  let legs: ProcessItem;
  let classItem: ProcessItem;

  // use these for testing as they are reset after each test
  let items: ProcessItem[];
  let generalMods: ProcessMod[];
  let combatMods: ProcessMod[];
  let activityMods: ProcessMod[];

  beforeAll(async () => {
    const [defs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    for (const store of stores) {
      for (const storeItem of store.items) {
        if (!helmet && isArmor2Helmet(storeItem)) {
          helmet = mapDimItemToProcessItem({
            dimItem: storeItem,
            assumeArmorMasterwork: undefined,
            lockArmorEnergyType: undefined,
          });
        }
        if (!arms && isArmor2Arms(storeItem)) {
          arms = mapDimItemToProcessItem({
            dimItem: storeItem,
            assumeArmorMasterwork: undefined,
            lockArmorEnergyType: undefined,
          });
        }
        if (!chest && isArmor2Chest(storeItem)) {
          chest = mapDimItemToProcessItem({
            dimItem: storeItem,
            assumeArmorMasterwork: undefined,
            lockArmorEnergyType: undefined,
          });
        }
        if (!legs && isArmor2Legs(storeItem)) {
          legs = mapDimItemToProcessItem({
            dimItem: storeItem,
            assumeArmorMasterwork: undefined,
            lockArmorEnergyType: undefined,
          });
        }
        if (!classItem && isArmor2ClassItem(storeItem)) {
          classItem = mapDimItemToProcessItem({
            dimItem: storeItem,
            assumeArmorMasterwork: undefined,
            lockArmorEnergyType: undefined,
          });
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
    activityMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(enhancedOperatorAugmentModHash) as PluggableInventoryItemDefinition
    );

    items = [helmet, arms, chest, legs, classItem];
    generalMods = [generalMod, generalMod, generalMod, generalMod, generalMod];
    combatMods = [combatMod, combatMod, combatMod, combatMod, combatMod];
    activityMods = [activityMod, activityMod, activityMod, activityMod, activityMod];
  });

  // Answers are derived as permutations of multisets
  // e.g. for energy levels [1, 2, 1, 2, 1] we have 3 1's and 2 2's. The formula for the
  // correct number of permutations is 5!/(3!2!) = 120/(6 * 2) = 10
  // for [1, 2, 3, 1, 2] we have 5!/(2!2!1!) = 120/(2 * 2) = 30
  test.each([
    [1, 1],
    [2, 10],
    [3, 30],
    [4, 60],
    [5, 120],
  ])('generates the correct number of permutations for %i unique mods', (n, result) => {
    const mods = generalMods.map((mod, i) => modifyMod({ mod, energyVal: i % n }));
    expect(generateProcessModPermutations(mods)).toHaveLength(result);
  });

  it('can fit all mods when there are no mods', () => {
    expect(canTakeSlotIndependentMods([[]], [[]], [[]], items)).toBe(true);
  });

  it('can fit five general mods', () => {
    const modifiedItems = items.map((item) =>
      modifyItem({ item, energyVal: item.energy!.capacity - generalMod.energy!.val })
    );
    const generalModPerms = generateProcessModPermutations(generalMods);
    expect(canTakeSlotIndependentMods(generalModPerms, [[]], [[]], modifiedItems)).toBe(true);
  });

  test.each([0, 1, 2, 3, 4])(
    'it can fit a general mod into a single item at index %i',
    (itemIndex) => {
      const modifiedItems = items.map((item, i) =>
        modifyItem({
          item,
          energyType: generalMod.energy!.type,
          energyVal:
            itemIndex === i
              ? item.energy!.capacity - generalMod.energy!.val
              : item.energy!.capacity,
        })
      );
      const combatModPerms = generateProcessModPermutations([combatMod]);
      expect(canTakeSlotIndependentMods([[]], combatModPerms, [[]], modifiedItems)).toBe(true);
    }
  );

  test.each([
    ['can', 'combat'],
    ["can't", 'not-a-tag'],
  ])('it %s fit five combat mods', (canFit, tag) => {
    const modifiedItems = items.map((item) =>
      modifyItem({
        item,
        energyType: combatMod.energy!.type,
        energyVal: item.energy!.capacity - combatMod.energy!.val,
        compatibleModSeasons: [tag],
      })
    );
    const combatModPerms = generateProcessModPermutations(combatMods);
    // sanity check
    expect(canTakeSlotIndependentMods([[]], combatModPerms, [[]], modifiedItems)).toBe(
      canFit === 'can'
    );
  });

  test.each([0, 1, 2, 3, 4])(
    'it can fit a combat mod into a single item at index %i',
    (itemIndex) => {
      const modifiedItems = items.map((item, i) =>
        modifyItem({
          item,
          energyType: combatMod.energy!.type,
          energyVal: item.energy!.capacity - combatMod.energy!.val,
          compatibleModSeasons: i === itemIndex ? [combatMod.tag!] : [],
        })
      );
      const combatModPerms = generateProcessModPermutations([combatMod]);
      expect(canTakeSlotIndependentMods([[]], combatModPerms, [[]], modifiedItems)).toBe(true);
    }
  );

  test.each([
    ['can', 'deepstonecrypt'],
    ["can't", 'not-a-tag'],
  ])('it %s fit five activity mods', (canFit, tag) => {
    const modifiedItems = items.map((item) =>
      modifyItem({
        item,
        energyType: activityMod.energy!.type,
        energyVal: item.energy!.capacity - activityMod.energy!.val,
        compatibleModSeasons: [tag],
      })
    );
    const activityModPerms = generateProcessModPermutations(activityMods);
    // sanity check
    expect(canTakeSlotIndependentMods([[]], [[]], activityModPerms, modifiedItems)).toBe(
      canFit === 'can'
    );
  });

  test.each([0, 1, 2, 3, 4])(
    'it can fit a activity mod into a single item at index %i',
    (itemIndex) => {
      const modifiedItems = items.map((item, i) =>
        modifyItem({
          item,
          energyType: combatMod.energy!.type,
          energyVal: item.energy!.capacity - combatMod.energy!.val,
          compatibleModSeasons: i === itemIndex ? [activityMod.tag!] : [],
        })
      );
      const activityModPerms = generateProcessModPermutations([activityMod]);
      expect(canTakeSlotIndependentMods([[]], [[]], activityModPerms, modifiedItems)).toBe(true);
    }
  );

  it('can fit general, activity, and combat mods if there is enough energy', () => {
    const modifiedItems: ProcessItem[] = [...items];
    modifiedItems[4] = modifyItem({
      item: modifiedItems[4],
      energyType: DestinyEnergyType.Void,
      energyVal: 9,
      compatibleModSeasons: [activityMod.tag!, combatMod.tag!],
    });

    const modifiedGeneralMod = modifyMod({
      mod: generalMod,
      energyType: DestinyEnergyType.Void,
      energyVal: 3,
    });
    const modifiedCombatMod = modifyMod({
      mod: combatMod,
      energyType: DestinyEnergyType.Void,
      energyVal: 3,
    });
    const modifiedActivityMod = modifyMod({
      mod: activityMod,
      energyType: DestinyEnergyType.Void,
      energyVal: 3,
    });

    const generalModPerms = generateProcessModPermutations([modifiedGeneralMod]);
    const combatModPerms = generateProcessModPermutations([modifiedCombatMod]);
    const activityModPerms = generateProcessModPermutations([modifiedActivityMod]);

    expect(
      canTakeSlotIndependentMods(generalModPerms, combatModPerms, activityModPerms, modifiedItems)
    ).toBe(false);
  });

  test.each(['general', 'combat', 'activity'])(
    "can't fit mods if %s mods have too much energy",
    (modType) => {
      const modifiedItems: ProcessItem[] = [...items];
      modifiedItems[4] = modifyItem({
        item: modifiedItems[4],
        energyType: DestinyEnergyType.Void,
        energyVal: 9,
        compatibleModSeasons: [activityMod.tag!, combatMod.tag!],
      });

      const modifiedGeneralMod = modifyMod({
        mod: generalMod,
        energyType: DestinyEnergyType.Void,
        energyVal: modType === 'general' ? 4 : 3,
      });
      const modifiedCombatMod = modifyMod({
        mod: combatMod,
        energyType: DestinyEnergyType.Void,
        energyVal: modType === 'combat' ? 4 : 3,
      });
      const modifiedActivityMod = modifyMod({
        mod: activityMod,
        energyType: DestinyEnergyType.Void,
        energyVal: modType === 'activity' ? 4 : 3,
      });

      const generalModPerms = generateProcessModPermutations([modifiedGeneralMod]);
      const combatModPerms = generateProcessModPermutations([modifiedCombatMod]);
      const activityModPerms = generateProcessModPermutations([modifiedActivityMod]);

      expect(
        canTakeSlotIndependentMods(generalModPerms, combatModPerms, activityModPerms, modifiedItems)
      ).toBe(false);
    }
  );

  test.each(['general', 'combat', 'activity'])(
    "can't fit mods if a %s mod has the wrong element",
    (modType) => {
      const modifiedItems: ProcessItem[] = [...items];
      modifiedItems[4] = modifyItem({
        item: modifiedItems[4],
        energyType: DestinyEnergyType.Void,
        energyVal: 9,
        compatibleModSeasons: [activityMod.tag!, combatMod.tag!],
      });

      const modifiedGeneralMod = modifyMod({
        mod: generalMod,
        energyType: modType === 'general' ? DestinyEnergyType.Arc : DestinyEnergyType.Void,
        energyVal: 3,
      });
      const modifiedCombatMod = modifyMod({
        mod: combatMod,
        energyType: modType === 'combat' ? DestinyEnergyType.Arc : DestinyEnergyType.Void,
        energyVal: 3,
      });
      const modifiedActivityMod = modifyMod({
        mod: activityMod,
        energyType: modType === 'activity' ? DestinyEnergyType.Arc : DestinyEnergyType.Void,
        energyVal: 3,
      });

      const generalModPerms = generateProcessModPermutations([modifiedGeneralMod]);
      const combatModPerms = generateProcessModPermutations([modifiedCombatMod]);
      const activityModPerms = generateProcessModPermutations([modifiedActivityMod]);

      expect(
        canTakeSlotIndependentMods(generalModPerms, combatModPerms, activityModPerms, modifiedItems)
      ).toBe(false);
    }
  );
});
