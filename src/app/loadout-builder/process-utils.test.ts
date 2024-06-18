import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { armorStats } from 'app/search/d2-known-values';
import { emptySet } from 'app/utils/empty';
import { StatHashes } from 'data/d2/generated-enums';
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
  LoSessionInfo,
  generateProcessModPermutations,
  pickAndAssignSlotIndependentMods,
  pickOptimalStatMods,
  precalculateStructures,
  updateMaxTiers,
} from './process-worker/process-utils';
import { ModAssignmentStatistics, ProcessItem, ProcessMod } from './process-worker/types';
import {
  getAutoMods,
  mapArmor2ModToProcessMod,
  mapAutoMods,
  mapDimItemToProcessItem,
} from './process/mappers';
import { ArmorStatHashes, MIN_LO_ITEM_ENERGY, MinMaxTier, ResolvedStatConstraint } from './types';
import { statTier } from './utils';

// We don't really pay attention to this in the tests but the parameter is needed
const modStatistics: ModAssignmentStatistics = {
  earlyModsCheck: { timesChecked: 0, timesFailed: 0 },
  autoModsPick: { timesChecked: 0, timesFailed: 0 },
  finalAssignment: {
    modAssignmentAttempted: 0,
    modsAssignmentFailed: 0,
    autoModsAssignmentFailed: 0,
  },
};

function modifyMod({
  mod,
  energyCost,
  tag,
}: {
  mod: ProcessMod;
  energyCost?: number;
  tag?: string | null;
}) {
  const newMod = { ...mod };

  if (energyCost !== undefined) {
    newMod.energyCost = energyCost;
  }

  if (tag !== undefined) {
    newMod.tag = tag !== null ? tag : undefined;
  }

  return newMod;
}

function modifyItem({
  item,
  remainingEnergyCapacity,
  compatibleModSeasons,
  isArtifice,
}: {
  item: ProcessItem;
  remainingEnergyCapacity?: number;
  compatibleModSeasons?: string[];
  isArtifice?: boolean;
}) {
  const newItem = { ...item };

  if (remainingEnergyCapacity !== undefined) {
    newItem.remainingEnergyCapacity = remainingEnergyCapacity;
  }

  if (compatibleModSeasons !== undefined) {
    newItem.compatibleModSeasons = compatibleModSeasons;
  }

  if (isArtifice !== undefined) {
    newItem.isArtifice = isArtifice;
  }

  return newItem;
}

// The tsconfig in the process worker folder messes with tests so they live outside of it.
describe('process-utils mod assignment', () => {
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
      defs.InventoryItem.get(recoveryModHash) as PluggableInventoryItemDefinition,
    );
    activityMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(enhancedOperatorAugmentModHash) as PluggableInventoryItemDefinition,
    );

    items = [helmet, arms, chest, legs, classItem];
    generalMods = [generalMod, generalMod, generalMod, generalMod, generalMod];
    activityMods = [activityMod, activityMod, activityMod, activityMod, activityMod];
  });

  const canTakeSlotIndependentMods = (
    generalMods: ProcessMod[],
    activityMods: ProcessMod[],
    items: ProcessItem[],
  ) => {
    const autoMods = { generalMods: {}, artificeMods: {} };
    const neededStats = [0, 0, 0, 0, 0, 0];
    const precalculatedInfo = precalculateStructures(
      autoMods,
      generalMods,
      activityMods,
      false,
      armorStats,
    );

    return (
      pickAndAssignSlotIndependentMods(precalculatedInfo, modStatistics, items, neededStats, 0) !==
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
    const mods = generalMods.map((mod, i) => modifyMod({ mod, energyCost: i % n }));
    expect(generateProcessModPermutations(mods)).toHaveLength(result);
  });

  it('can fit all mods when there are no mods', () => {
    expect(canTakeSlotIndependentMods([], [], items)).toBe(true);
  });

  it('can fit five general mods', () => {
    const modifiedItems = items.map((item) =>
      modifyItem({ item, remainingEnergyCapacity: generalMod.energyCost }),
    );
    expect(canTakeSlotIndependentMods(generalMods, [], modifiedItems)).toBe(true);
  });

  test.each([0, 1, 2, 3, 4])(
    'it can fit a general mod into a single item at index %i',
    (itemIndex) => {
      const modifiedItems = items.map((item, i) =>
        modifyItem({
          item,
          remainingEnergyCapacity: itemIndex === i ? generalMod.energyCost : 0,
        }),
      );
      expect(canTakeSlotIndependentMods([], [], modifiedItems)).toBe(true);
    },
  );

  test.each([
    ['can', 'deepstonecrypt'],
    ["can't", 'not-a-tag'],
  ])('it %s fit five activity mods', (canFit, tag) => {
    const modifiedItems = items.map((item) =>
      modifyItem({
        item,
        remainingEnergyCapacity: activityMod.energyCost,
        compatibleModSeasons: [tag],
      }),
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
          remainingEnergyCapacity: 2,
          compatibleModSeasons: i === itemIndex ? [activityMod.tag!] : [],
        }),
      );
      expect(canTakeSlotIndependentMods([], [activityMod], modifiedItems)).toBe(true);
    },
  );

  it('can fit general, activity, and combat mods if there is enough energy', () => {
    const modifiedItems: ProcessItem[] = [...items];
    modifiedItems[4] = modifyItem({
      item: modifiedItems[4],
      remainingEnergyCapacity: 6,
      compatibleModSeasons: [activityMod.tag!],
    });

    const modifiedGeneralMod = modifyMod({
      mod: generalMod,
      energyCost: 3,
    });
    const modifiedActivityMod = modifyMod({
      mod: activityMod,
      energyCost: 3,
    });

    expect(
      canTakeSlotIndependentMods([modifiedGeneralMod], [modifiedActivityMod], modifiedItems),
    ).toBe(true);
  });

  it("can't fit general, activity, and combat mods if there isn't enough energy", () => {
    const modifiedItems: ProcessItem[] = [...items];
    modifiedItems[4] = modifyItem({
      item: modifiedItems[4],
      remainingEnergyCapacity: 1,
      compatibleModSeasons: [activityMod.tag!],
    });

    const modifiedGeneralMod = modifyMod({
      mod: generalMod,
      energyCost: 3,
    });
    const modifiedActivityMod = modifyMod({
      mod: activityMod,
      energyCost: 3,
    });

    expect(
      canTakeSlotIndependentMods([modifiedGeneralMod], [modifiedActivityMod], modifiedItems),
    ).toBe(false);
  });

  test.each(['general', 'combat', 'activity'])(
    "can't fit mods if %s mods have too much energy",
    (modType) => {
      const modifiedItems: ProcessItem[] = [...items];
      modifiedItems[4] = modifyItem({
        item: modifiedItems[4],
        remainingEnergyCapacity: 1,
        compatibleModSeasons: [activityMod.tag!],
      });

      const modifiedGeneralMod = modifyMod({
        mod: generalMod,
        energyCost: modType === 'general' ? 6 : 5,
      });
      const modifiedActivityMod = modifyMod({
        mod: activityMod,
        energyCost: modType === 'activity' ? 6 : 5,
      });

      expect(
        canTakeSlotIndependentMods([modifiedGeneralMod], [modifiedActivityMod], modifiedItems),
      ).toBe(false);
    },
  );
});

/**
 * To test auto mod picks to hit certain stats, we set up some constraints that give us one solution,
 * and then constrain the problem some more and expect no solution.
 *
 * Our constraints/picked mods+stats are:
 *   * The user picked two general mods (cost 4 and 3) and one activity mod (cost 1).
 *   * We have 4 artifice slots, and 3 remaining general mod slots.
 *   * We need 4 mobility, 0 resilience, 10 recovery, 12 discipline, 4 intellect, 0 strength.
 *   * Our armor pieces have [3, 4, 1, 3, 4] energy left
 *   * the activity pieces are   ^     ^
 *     (one of them is a trap; the 4-cost piece must hold one of the 4-cost general mods and can't hold the activity mod)
 *
 * The expected solution uses 4 artifice discipline mods, a 4 cost major recovery mod, a 1 cost small mobility mod and a 2 cost small intellect mod.
 * The activity mod goes into the 3-energy piece for the mods to fit.
 */
describe('process-utils auto mods', () => {
  let generalMod: ProcessMod;
  let generalModCopy: ProcessMod;
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

  let loSessionInfo: LoSessionInfo;
  let neededStats: number[];

  beforeAll(async () => {
    const defs = await getTestDefinitions();
    const makeItem = (
      artifice: boolean,
      index: number,
      energyCapacity: number,
      seasons: string[],
    ) => ({
      hash: index,
      id: index.toString(),
      isArtifice: artifice,
      isExotic: false,
      name: `Item ${index}`,
      power: 1500,
      stats: [0, 0, 0, 0, 0, 0],
      compatibleModSeasons: seasons,
      remainingEnergyCapacity: energyCapacity,
    });
    helmet = makeItem(true, 1, 3, []);
    arms = makeItem(true, 2, 4, ['deepstonecrypt']);
    chest = makeItem(false, 3, 1, []);
    legs = makeItem(true, 4, 3, ['deepstonecrypt']);
    classItem = makeItem(true, 5, 4, []);
    generalMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(recoveryModHash) as PluggableInventoryItemDefinition,
    );
    generalMod.energyCost = 4;
    generalModCopy = { ...generalMod, energyCost: 3 };
    activityMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(enhancedOperatorAugmentModHash) as PluggableInventoryItemDefinition,
    );
    activityMod.energyCost = 1;

    items = [helmet, arms, chest, legs, classItem];
    generalMods = [generalModCopy, generalMod];
    activityMods = [activityMod];

    const autoModData = mapAutoMods(getAutoMods(defs, emptySet()));
    loSessionInfo = precalculateStructures(
      autoModData,
      generalMods,
      activityMods,
      true,
      armorStats,
    );
    neededStats = [4, 0, 10, 12, 4, 0];
  });

  it('the problem is solvable', () => {
    const solution = pickAndAssignSlotIndependentMods(
      loSessionInfo,
      modStatistics,
      items,
      neededStats,
      4,
    );
    expect(solution).not.toBe(undefined);
    expect(solution).toMatchSnapshot();
  });

  it('higher stats means we cannot find a viable set of picks', () => {
    for (let i = 0; i < 6; i++) {
      const newNeededStats = [...neededStats];
      newNeededStats[i] += 2;
      expect(
        pickAndAssignSlotIndependentMods(loSessionInfo, modStatistics, items, newNeededStats, 4),
      ).toBe(undefined);
    }
  });

  it('we need all artifice mod slots', () => {
    expect(
      pickAndAssignSlotIndependentMods(loSessionInfo, modStatistics, items, neededStats, 3),
    ).toBe(undefined);
  });

  it('we need all the energy capacity in all general mod slots', () => {
    const ourItems = [...items];
    ourItems[1] = modifyItem({ item: items[1], remainingEnergyCapacity: 3 });
    expect(
      pickAndAssignSlotIndependentMods(loSessionInfo, modStatistics, ourItems, neededStats, 4),
    ).toBe(undefined);
  });

  it('activity mod cannot go into the other item if we want to hit stats', () => {
    const ourItems = [...items];
    ourItems[1] = modifyItem({ item: items[3], compatibleModSeasons: [] });
    expect(
      pickAndAssignSlotIndependentMods(loSessionInfo, modStatistics, ourItems, neededStats, 4),
    ).toBe(undefined);
  });
});

/**
 * To test optimal stat mod picking, we set up a bunch of sets defined by armor stats, remaining energies, and artifice slots,
 * and expect it to correctly find the highest total tier.
 */
describe('process-utils optimal mods', () => {
  let helmet: ProcessItem;
  let arms: ProcessItem;
  let chest: ProcessItem;
  let legs: ProcessItem;
  let classItem: ProcessItem;

  // use these for testing as they are reset after each test
  let items: ProcessItem[];
  let resolvedStatConstraints: ResolvedStatConstraint[];
  let loSessionInfo: LoSessionInfo;

  beforeAll(async () => {
    const defs = await getTestDefinitions();
    const makeItem = (index: number) => ({
      hash: index,
      id: index.toString(),
      isArtifice: false,
      isExotic: false,
      name: `Item ${index}`,
      power: 1500,
      stats: [0, 0, 0, 0, 0, 0],
      compatibleModSeasons: [],
      remainingEnergyCapacity: 10,
    });
    helmet = makeItem(1);
    arms = makeItem(2);
    chest = makeItem(3);
    legs = makeItem(4);
    classItem = makeItem(5);

    items = [helmet, arms, chest, legs, classItem];

    const autoModData = mapAutoMods(getAutoMods(defs, emptySet()));
    loSessionInfo = precalculateStructures(autoModData, [], [], true, armorStats);

    resolvedStatConstraints = armorStats.map((statHash) => ({
      statHash,
      ignored: false,
      maxTier: 8,
      minTier: 3,
    }));
  });

  const tierCases: [
    setStats: number[],
    remainingEnergy: number[],
    numArtifice: number,
    expectedTiers: number[],
  ][] = [
    // the trick here is that we can use two small mods to boost resilience by a tier,
    // but it's better to use two large mods to boost discipline (cheaper mods...)
    [[80, 70, 80, 40, 30, 30], [0, 3, 0, 3, 0], 0, [8, 7, 8, 6, 3, 3]],
    // ensure we combine artifice and small mods if needed
    [[63, 70, 59, 35, 30, 30], [2, 0, 0, 0, 0], 3, [7, 7, 6, 3, 3, 3]],
    // ensure we can use a cheap +5 mod to bump the 35 dis to 4 while using artifice on resilience
    [[80, 65, 80, 35, 30, 30], [1, 0, 0, 0, 0], 2, [8, 7, 8, 4, 3, 3]],
    // ensure we get two tiers in mobility
    [[68, 66, 30, 30, 30, 30], [0, 0, 0, 0, 0], 4, [8, 6, 3, 3, 3, 3]],
    // do everything we can to hit min bounds
    [[68, 66, 30, 30, 11, 30], [2, 2, 0, 0, 0], 4, [7, 6, 3, 3, 3, 3]],
    // ensure that negative stat amounts aren't clamped too early
    [[30, 61, 30, 30, 30, -14], [5, 5, 5, 5, 5], 5, [5, 6, 3, 3, 3, 3]],
  ];

  const pickMods = (setStats: number[], remainingEnergy: number[], numArtifice: number) => {
    const ourItems = [...items];
    for (let i = 0; i < ourItems.length; i++) {
      ourItems[i] = modifyItem({
        item: ourItems[i],
        remainingEnergyCapacity: remainingEnergy[i],
        isArtifice: i < numArtifice,
      });
    }
    const statMods = pickOptimalStatMods(
      loSessionInfo,
      ourItems,
      setStats,
      resolvedStatConstraints,
    )!;
    const finalStats = [...setStats];
    for (let i = 0; i < armorStats.length; i++) {
      finalStats[i] += statMods.bonusStats[i];
    }
    return finalStats;
  };

  test.each(tierCases)(
    'set with stats %p, energies %p, numArtifice %p yields tiers %p',
    (setStats, remainingEnergy, numArtifice, expectedTiers) => {
      const finalStats = pickMods(setStats, remainingEnergy, numArtifice);
      expect(finalStats.map(statTier)).toStrictEqual(expectedTiers);
    },
  );

  // Tests that our algorithm, and thus the worker accurately reports the resulting stats
  const exactStatCases: [
    setStats: number[],
    remainingEnergy: number[],
    numArtifice: number,
    expectedStats: number[],
  ][] = [
    // Nice
    [[18, 80, 80, 26, 80, 30], [0, 0, 0, 3, 0], 4, [30, 80, 80, 31, 80, 30]],
    // TODO: This is the same problem as above, only with reordered stats. The solution
    // is still optimal in terms of reached stats, but worse in terms of mod usage
    [[26, 80, 80, 18, 80, 30], [0, 0, 0, 3, 0], 4, [32, 80, 80, 31, 80, 30]],
  ];

  test.each(exactStatCases)(
    'set with stats %p, energies %p, numArtifice %p produces exact stats %p',
    (setStats, remainingEnergy, numArtifice, expectedStats) => {
      const finalStats = pickMods(setStats, remainingEnergy, numArtifice);
      expect(finalStats).toStrictEqual(expectedStats);
    },
  );
});

// This tests against a bug where an activity mod would accidentally be considered
// eligible and fitting if it required as much or more energy than was remaining in any item,
// even if it didn't have the mod slot.
test('process-utils activity mods', async () => {
  const defs = await getTestDefinitions();

  const makeItem = (index: number, remainingEnergyCapacity: number) => ({
    hash: index,
    id: index.toString(),
    isArtifice: false,
    isExotic: index === 2,
    name: `Item ${index}`,
    power: 1500,
    stats: [0, 0, 0, 0, 0, 0],
    compatibleModSeasons: index === 2 ? [] : ['nightmare'],
    remainingEnergyCapacity,
  });

  const statOrder: ArmorStatHashes[] = [
    StatHashes.Resilience, // expensive
    StatHashes.Recovery, // expensive
    StatHashes.Strength, // cheap
    StatHashes.Discipline, // cheap
    StatHashes.Intellect, // expensive
    StatHashes.Mobility, // cheap
  ];

  // The setup here is the following: All items have one or two energy
  // remaining, but the mods cost at least one energy, so all items have
  // at most one energy remaining, which is not enough for an expensive minor mod.
  // Under the buggy condition, the 2-cost mod can be assigned to the arms piece,
  // even though it is an exotic without the relevant mod slot, leaving 2 energy for
  // a +5 resilience mod in an item that actually needs to hold an activity mod.
  const helmet = makeItem(1, 2);
  const arms = makeItem(2, 1);
  const chest = makeItem(3, 1);
  const legs = makeItem(4, 1);
  const classItem = makeItem(5, 2);

  const items = [helmet, arms, chest, legs, classItem];

  // Costs 1, 1, 1, 2

  const modHashes = [
    1560574695, // InventoryItem "Nightmare Breaker"
    1560574695, // InventoryItem "Nightmare Breaker"
    1560574695, // InventoryItem "Nightmare Breaker"
    1565861116, // InventoryItem "Enhanced Nightmare Crusher"
  ];
  const activityMods = modHashes.map(
    (hash) => defs.InventoryItem.get(hash) as PluggableInventoryItemDefinition,
  );

  const autoModData = mapAutoMods(getAutoMods(defs, emptySet()));

  const loSessionInfo = precalculateStructures(
    autoModData,
    [],
    activityMods.map(mapArmor2ModToProcessMod),
    true,
    statOrder,
  );

  const resolvedStatConstraints = statOrder.map((statHash) => ({
    statHash,
    ignored: false,
    maxTier: 10,
    minTier: 0,
  }));

  const setStats = [55, 55, 55, 50, 50, 50];

  // First, verify that our set can fit the mods
  const result = pickAndAssignSlotIndependentMods(
    loSessionInfo,
    modStatistics,
    items,
    [0, 0, 0, 0, 0, 0],
    0,
  )!;
  expect(result).not.toBeUndefined();

  // Then check that optimal and maximally available tiers only report
  // the cheaper stats where the mods can actually fit
  const autoMods = pickOptimalStatMods(loSessionInfo, items, setStats, resolvedStatConstraints);
  expect(autoMods).not.toBeUndefined();
  expect(autoMods!.bonusStats).toEqual([0, 0, 5, 0, 0, 0]);

  const minMaxesInStatOrder: MinMaxTier[] = [
    { minTier: 0, maxTier: 0 },
    { minTier: 0, maxTier: 0 },
    { minTier: 0, maxTier: 0 },
    { minTier: 0, maxTier: 0 },
    { minTier: 0, maxTier: 0 },
    { minTier: 0, maxTier: 0 },
  ];
  updateMaxTiers(
    loSessionInfo,
    items,
    setStats,
    setStats.map(statTier),
    0,
    resolvedStatConstraints,
    minMaxesInStatOrder,
  )!;
  expect(minMaxesInStatOrder.map((stat) => stat.maxTier)).toEqual([5, 5, 6, 6, 5, 6]);
});
