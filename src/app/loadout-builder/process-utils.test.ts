import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import {
  enhancedOperatorAugmentModHash,
  isArmor2Arms,
  isArmor2Chest,
  isArmor2ClassItem,
  isArmor2Helmet,
  isArmor2Legs,
  recoveryModHash,
} from 'testing/test-item-utils';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import {
  generateProcessModPermutations,
  pickAndAssignSlotIndependentMods,
  precalculateStructures,
} from './process-worker/process-utils';
import { ModAssignmentStatistics, ProcessItem, ProcessMod } from './process-worker/types';
import { mapArmor2ModToProcessMod, mapDimItemToProcessItem } from './process/mappers';
import { ArmorStatHashes, MIN_LO_ITEM_ENERGY } from './types';

function modifyMod({
  mod,
  energyVal,
  tag,
}: {
  mod: ProcessMod;
  energyVal?: number;
  tag?: string | null;
}) {
  const newMod = _.cloneDeep(mod);

  if (energyVal !== undefined) {
    newMod.energy!.val = energyVal;
  }

  if (tag !== undefined) {
    newMod.tag = tag !== null ? tag : undefined;
  }

  return newMod;
}

function modifyItem({
  item,
  energyVal,
  compatibleModSeasons,
}: {
  item: ProcessItem;
  energyVal?: number;
  compatibleModSeasons?: string[];
}) {
  const newItem = _.cloneDeep(item);

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
  let activityMod: ProcessMod;

  let helmet: ProcessItem;
  let arms: ProcessItem;
  let chest: ProcessItem;
  let legs: ProcessItem;
  let classItem: ProcessItem;

  // use these for testing as they are reset after each test
  let items: ProcessItem[];
  let generalMods: ProcessMod[];
  let activityMods: ProcessMod[];

  const armorEnergyRules = {
    assumeArmorMasterwork: AssumeArmorMasterwork.None,
    minItemEnergy: MIN_LO_ITEM_ENERGY,
  };

  beforeAll(async () => {
    const [defs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    for (const store of stores) {
      for (const storeItem of store.items) {
        if (!helmet && isArmor2Helmet(storeItem)) {
          helmet = mapDimItemToProcessItem({
            dimItem: storeItem,
            armorEnergyRules,
          });
        }
        if (!arms && isArmor2Arms(storeItem)) {
          arms = mapDimItemToProcessItem({
            dimItem: storeItem,
            armorEnergyRules,
          });
        }
        if (!chest && isArmor2Chest(storeItem)) {
          chest = mapDimItemToProcessItem({
            dimItem: storeItem,
            armorEnergyRules,
          });
        }
        if (!legs && isArmor2Legs(storeItem)) {
          legs = mapDimItemToProcessItem({
            dimItem: storeItem,
            armorEnergyRules,
          });
        }
        if (!classItem && isArmor2ClassItem(storeItem)) {
          classItem = mapDimItemToProcessItem({
            dimItem: storeItem,
            armorEnergyRules,
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
    activityMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(enhancedOperatorAugmentModHash) as PluggableInventoryItemDefinition
    );

    items = [helmet, arms, chest, legs, classItem];
    generalMods = [generalMod, generalMod, generalMod, generalMod, generalMod];
    activityMods = [activityMod, activityMod, activityMod, activityMod, activityMod];
  });

  const canTakeSlotIndependentMods = (
    generalMods: ProcessMod[],
    activityMods: ProcessMod[],
    items: ProcessItem[]
  ) => {
    const statOrder: ArmorStatHashes[] = [
      StatHashes.Mobility,
      StatHashes.Resilience,
      StatHashes.Recovery,
      StatHashes.Discipline,
      StatHashes.Intellect,
      StatHashes.Strength,
    ];
    const neededStats = [0, 0, 0, 0, 0, 0];
    const precalculatedInfo = precalculateStructures(generalMods, activityMods, false, statOrder);
    const modStatistics: ModAssignmentStatistics = {
      earlyModsCheck: { timesChecked: 0, timesFailed: 0 },
      autoModsPick: { timesChecked: 0, timesFailed: 0 },
      finalAssignment: {
        modAssignmentAttempted: 0,
        modsAssignmentFailed: 0,
        autoModsAssignmentFailed: 0,
      },
    };
    return (
      pickAndAssignSlotIndependentMods(precalculatedInfo, modStatistics, items, neededStats) !==
      undefined
    );
  };

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
    expect(canTakeSlotIndependentMods([], [], items)).toBe(true);
  });

  it('can fit five general mods', () => {
    const modifiedItems = items.map((item) =>
      modifyItem({ item, energyVal: item.energy!.capacity - generalMod.energy!.val })
    );
    expect(canTakeSlotIndependentMods(generalMods, [], modifiedItems)).toBe(true);
  });

  test.each([0, 1, 2, 3, 4])(
    'it can fit a general mod into a single item at index %i',
    (itemIndex) => {
      const modifiedItems = items.map((item, i) =>
        modifyItem({
          item,
          energyVal:
            itemIndex === i
              ? item.energy!.capacity - generalMod.energy!.val
              : item.energy!.capacity,
        })
      );
      expect(canTakeSlotIndependentMods([], [], modifiedItems)).toBe(true);
    }
  );

  test.each([
    ['can', 'deepstonecrypt'],
    ["can't", 'not-a-tag'],
  ])('it %s fit five activity mods', (canFit, tag) => {
    const modifiedItems = items.map((item) =>
      modifyItem({
        item,
        energyVal: item.energy!.capacity - activityMod.energy!.val,
        compatibleModSeasons: [tag],
      })
    );
    // sanity check
    expect(canTakeSlotIndependentMods([], activityMods, modifiedItems)).toBe(canFit === 'can');
  });

  test.each([0, 1, 2, 3, 4])(
    'it can fit a activity mod into a single item at index %i',
    (itemIndex) => {
      const modifiedItems = items.map((item, i) =>
        modifyItem({
          item,
          energyVal: item.energy!.capacity - 2,
          compatibleModSeasons: i === itemIndex ? [activityMod.tag!] : [],
        })
      );
      expect(canTakeSlotIndependentMods([], [activityMod], modifiedItems)).toBe(true);
    }
  );

  it('can fit general, activity, and combat mods if there is enough energy', () => {
    const modifiedItems: ProcessItem[] = [...items];
    modifiedItems[4] = modifyItem({
      item: modifiedItems[4],
      energyVal: 4,
      compatibleModSeasons: [activityMod.tag!],
    });

    const modifiedGeneralMod = modifyMod({
      mod: generalMod,
      energyVal: 3,
    });
    const modifiedActivityMod = modifyMod({
      mod: activityMod,
      energyVal: 3,
    });

    expect(
      canTakeSlotIndependentMods([modifiedGeneralMod], [modifiedActivityMod], modifiedItems)
    ).toBe(true);
  });

  it("can't fit general, activity, and combat mods if there is enough energy", () => {
    const modifiedItems: ProcessItem[] = [...items];
    modifiedItems[4] = modifyItem({
      item: modifiedItems[4],
      energyVal: 9,
      compatibleModSeasons: [activityMod.tag!],
    });

    const modifiedGeneralMod = modifyMod({
      mod: generalMod,
      energyVal: 3,
    });
    const modifiedActivityMod = modifyMod({
      mod: activityMod,
      energyVal: 3,
    });

    expect(
      canTakeSlotIndependentMods([modifiedGeneralMod], [modifiedActivityMod], modifiedItems)
    ).toBe(false);
  });

  test.each(['general', 'combat', 'activity'])(
    "can't fit mods if %s mods have too much energy",
    (modType) => {
      const modifiedItems: ProcessItem[] = [...items];
      modifiedItems[4] = modifyItem({
        item: modifiedItems[4],
        energyVal: 9,
        compatibleModSeasons: [activityMod.tag!],
      });

      const modifiedGeneralMod = modifyMod({
        mod: generalMod,
        energyVal: modType === 'general' ? 6 : 5,
      });
      const modifiedActivityMod = modifyMod({
        mod: activityMod,
        energyVal: modType === 'activity' ? 6 : 5,
      });

      expect(
        canTakeSlotIndependentMods([modifiedGeneralMod], [modifiedActivityMod], modifiedItems)
      ).toBe(false);
    }
  );
});
