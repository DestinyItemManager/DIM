import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { MAX_STAT } from 'app/loadout/known-values';
import { armorStats } from 'app/search/d2-known-values';
import { emptySet } from 'app/utils/empty';
import { StatHashes } from 'data/d2/generated-enums';
import { getTestDefinitions } from 'testing/test-utils';
import { getAutoMods, mapArmor2ModToProcessMod, mapAutoMods } from '../process/mappers';
import { ArmorStatHashes, DesiredStatRange, MinMaxStat, ResolvedStatConstraint } from '../types';
import {
  LoSessionInfo,
  pickOptimalStatMods,
  precalculateStructures,
  updateMaxStats,
} from './process-utils';
import { AutoModData, ModAssignmentStatistics, ProcessItem } from './types';

// We don't really pay attention to this in the tests but the parameter is needed
const modStatistics: ModAssignmentStatistics = {
  earlyModsCheck: { timesChecked: 0, timesFailed: 0 },
  finalAssignment: {
    modAssignmentAttempted: 0,
    modsAssignmentFailed: 0,
  },
};

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
  const defaultConstraints: DesiredStatRange[] = armorStats.map((statHash) => ({
    statHash,
    minStat: 30,
    maxStat: 80,
  }));
  let autoModData: AutoModData;

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

    autoModData = mapAutoMods(getAutoMods(defs, emptySet()));
  });

  // TODO: These cases don't exactly make sense in the tierless world but it's hard to think through what they should do
  const tierCases: [
    setStats: number[],
    remainingEnergy: number[],
    numArtifice: number,
    expectedStats: number[],
    statMinMaxes: DesiredStatRange[],
  ][] = [
    // the trick here is that we can use two small mods to boost resilience,
    // but it's better to use two large mods to boost discipline (cheaper mods...)
    [[80, 70, 80, 40, 30, 30], [0, 3, 0, 3, 0], 0, [80, 80, 80, 50, 30, 30], defaultConstraints],
    // ensure we combine artifice and small mods if needed (all goes to first stat)
    [[63, 70, 59, 35, 30, 30], [2, 0, 0, 0, 0], 3, [77, 70, 59, 35, 30, 30], defaultConstraints],
    // ensure we can use a cheap +5 mod to bump the 35 dis to 40 while using artifice on resilience
    // TODO: Broken by removing the cost-dominance distinction between different mods (which would have happened in Edge of Fate anyway)
    // [[80, 65, 80, 35, 30, 30], [1, 0, 0, 0, 0], 2, [80, 71, 80, 40, 30, 30], defaultConstraints],
    // ensure we get two tiers in mobility
    [[68, 66, 30, 30, 30, 30], [0, 0, 0, 0, 0], 4, [80, 66, 30, 30, 30, 30], defaultConstraints],
    // do everything we can to hit min bounds
    [[68, 66, 30, 30, 11, 30], [2, 2, 0, 0, 0], 4, [71, 66, 30, 30, 30, 30], defaultConstraints],
    // ensure that negative stat amounts aren't clamped too early
    [[30, 61, 30, 30, 30, -14], [5, 5, 5, 5, 5], 5, [50, 61, 30, 30, 30, 31], defaultConstraints],
    // We should assign two +10 mods to the fourth stat using remaining energy,
    // but we had a bug where it assigned to the fifth, skipping the fourth stat
    [
      [82, 44, 73, 39, 40, 50],
      [10, 10, 10, 10, 10],
      5,
      [82, 80, 82, 59, 40, 50],
      // Pick specific stat constraints for this test
      [
        { statHash: StatHashes.Grenade, minStat: 0, maxStat: 82 },
        { statHash: StatHashes.Melee, minStat: 0, maxStat: 82 },
        { statHash: StatHashes.Class, minStat: 0, maxStat: 82 },
        { statHash: StatHashes.Super, minStat: 0, maxStat: 200 },
        { statHash: StatHashes.Weapons, minStat: 0, maxStat: 200 },
        { statHash: StatHashes.Health, minStat: 0, maxStat: 200 },
      ],
    ],
  ];

  const pickMods = (
    setStats: number[],
    remainingEnergy: number[],
    numArtifice: number,
    statMinMaxes: DesiredStatRange[],
  ) => {
    const ourItems = [...items];
    for (let i = 0; i < ourItems.length; i++) {
      ourItems[i] = modifyItem({
        item: ourItems[i],
        remainingEnergyCapacity: remainingEnergy[i],
        isArtifice: i < numArtifice,
      });
    }
    const statMods = pickOptimalStatMods(
      precalculateStructures(
        autoModData,
        [],
        [],
        true,
        statMinMaxes.map(({ statHash }) => statHash),
      ),
      modStatistics,
      ourItems,
      setStats,
      statMinMaxes,
    );
    const finalStats = [...setStats];
    for (let i = 0; i < armorStats.length; i++) {
      finalStats[i] += statMods!.bonusStats[i];
    }
    return finalStats;
  };

  test.each(tierCases)(
    'set with stats %p, energies %p, numArtifice %p yields tiers %p',
    (setStats, remainingEnergy, numArtifice, expectedTiers, statMinMaxes) => {
      const finalStats = pickMods(setStats, remainingEnergy, numArtifice, statMinMaxes);
      expect(finalStats).toStrictEqual(expectedTiers);
    },
  );

  // Tests that our algorithm, and thus the worker accurately reports the resulting stats
  const exactStatCases: [
    setStats: number[],
    remainingEnergy: number[],
    numArtifice: number,
    expectedStats: number[],
    statConstraints: DesiredStatRange[],
  ][] = [
    // Nice
    [[18, 80, 80, 26, 80, 30], [0, 0, 0, 3, 0], 4, [34, 80, 80, 32, 80, 30], defaultConstraints],
    // TODO: This is the same problem as above, only with reordered stats. The solution
    // is still optimal in terms of reached stats, but worse in terms of mod usage
    [[26, 80, 80, 18, 80, 30], [0, 0, 0, 3, 0], 4, [36, 80, 80, 30, 80, 30], defaultConstraints],
  ];

  test.each(exactStatCases)(
    'set with stats %p, energies %p, numArtifice %p produces exact stats %p',
    (setStats, remainingEnergy, numArtifice, expectedStats, statMinMaxes) => {
      const finalStats = pickMods(setStats, remainingEnergy, numArtifice, statMinMaxes);
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
    StatHashes.Health, // expensive
    StatHashes.Class, // expensive
    StatHashes.Melee, // cheap
    StatHashes.Grenade, // cheap
    StatHashes.Super, // expensive
    StatHashes.Weapons, // cheap
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

  const resolvedStatConstraints = statOrder.map(
    (statHash): ResolvedStatConstraint => ({
      statHash,
      ignored: false,
      maxStat: MAX_STAT,
      minStat: 0,
    }),
  );

  const setStats = [55, 55, 55, 50, 50, 50];

  // Then check that optimal and maximally available tiers only report
  // the cheaper stats where the mods can actually fit
  const autoMods = pickOptimalStatMods(
    loSessionInfo,
    modStatistics,
    items,
    setStats,
    resolvedStatConstraints,
  );
  expect(autoMods).not.toBeUndefined();
  expect(autoMods!.bonusStats).toEqual([10, 0, 0, 0, 0, 0]);

  const minMaxesInStatOrder: MinMaxStat[] = [
    { minStat: 0, maxStat: 0 },
    { minStat: 0, maxStat: 0 },
    { minStat: 0, maxStat: 0 },
    { minStat: 0, maxStat: 0 },
    { minStat: 0, maxStat: 0 },
    { minStat: 0, maxStat: 0 },
  ];
  updateMaxStats(loSessionInfo, items, setStats, 0, resolvedStatConstraints, minMaxesInStatOrder);
  expect(minMaxesInStatOrder.map((stat) => stat.maxStat)).toEqual([65, 65, 65, 60, 60, 60]);
});

describe('process-utils updateMaxStats', () => {
  let items: ProcessItem[];
  let loSessionInfo: LoSessionInfo;

  beforeAll(async () => {
    const defs = await getTestDefinitions();
    items = Array(5)
      .fill(null)
      .map((_, i) => ({
        hash: i,
        id: i.toString(),
        isArtifice: false,
        isExotic: false,
        name: `Item ${i}`,
        power: 1500,
        stats: [0, 0, 0, 0, 0, 0],
        compatibleModSeasons: [],
        remainingEnergyCapacity: 10,
      }));

    const autoModData = mapAutoMods(getAutoMods(defs, emptySet()));
    loSessionInfo = precalculateStructures(autoModData, [], [], true, armorStats);
  });

  const testCases: [
    description: string,
    setStats: number[],
    initialMinMaxes: { minStat: number; maxStat: number }[],
    filterMinStat: number,
    filterMaxStat: number | ((i: number) => number),
    foundAnyImprovement: boolean,
    expectedFirstMaxStat: number,
  ][] = [
    [
      'updates maxStat when minMax.maxStat < filter.minStat',
      [50, 50, 50, 50, 50, 50],
      Array(6).fill({ minStat: 0, maxStat: 55 }), // Lower than minStat
      60, // Higher than current maxStat
      100,
      false, // foundAnyImprovement is false when only updating to minStat requirement
      60,
    ],
    [
      'handles stat > minMax.maxStat condition',
      [85, 50, 50, 50, 50, 50],
      Array(6)
        .fill(null)
        .map((_, i) => ({ minStat: 0, maxStat: i === 0 ? 70 : 50 })), // First stat maxStat is 70
      30,
      (i: number) => (i === 0 ? 100 : 70), // First stat allows improvement
      true,
      135, // Can reach 135 with 5 large stat mods
    ],
    [
      'skips stat max already at MAX_STAT',
      [180, 50, 50, 50, 50, 50],
      Array(6)
        .fill(null)
        .map((_, i) => ({ minStat: 0, maxStat: i === 0 ? MAX_STAT : 50 })), // First stat already at MAX_STAT
      30,
      MAX_STAT,
      true,
      MAX_STAT, // Should remain unchanged
    ],
  ];

  test.each(testCases)(
    '%s',
    (
      _description,
      setStats,
      minMaxes,
      filterMinStat,
      filterMaxStat,
      expectedResult,
      expectedFirstMaxStat,
    ) => {
      const statFilters = armorStats.map((statHash, i) => ({
        statHash,
        minStat: filterMinStat,
        maxStat: typeof filterMaxStat === 'function' ? filterMaxStat(i) : filterMaxStat,
      }));

      const foundAnyImprovement = updateMaxStats(
        loSessionInfo,
        items,
        setStats,
        0,
        statFilters,
        minMaxes,
      );

      expect(foundAnyImprovement).toBe(expectedResult);
      expect(minMaxes[0].maxStat).toBe(expectedFirstMaxStat);
    },
  );
});

describe('process-utils pickOptimalStatMods edge cases', () => {
  let items: ProcessItem[];
  let loSessionInfo: LoSessionInfo;
  let autoModData: AutoModData;

  beforeAll(async () => {
    const defs = await getTestDefinitions();
    items = Array(5)
      .fill(null)
      .map((_, i) => ({
        hash: i,
        id: i.toString(),
        isArtifice: false,
        isExotic: false,
        name: `Item ${i}`,
        power: 1500,
        stats: [0, 0, 0, 0, 0, 0],
        compatibleModSeasons: [],
        remainingEnergyCapacity: 0, // No energy available
      }));
    autoModData = mapAutoMods(getAutoMods(defs, emptySet()));
    loSessionInfo = precalculateStructures(autoModData, [], [], true, armorStats);
  });

  it('returns empty when no mods can be picked', () => {
    const setStats = [0, 0, 0, 0, 0, 0];
    const desiredStatRanges = armorStats.map((statHash) => ({
      statHash,
      minStat: 100, // Impossible to achieve with no energy
      maxStat: 100,
    }));

    const result = pickOptimalStatMods(
      loSessionInfo,
      modStatistics,
      items,
      setStats,
      desiredStatRanges,
    );

    expect(result).toBeDefined();
    expect(result!.bonusStats).toEqual([0, 0, 0, 0, 0, 0]);
    expect(result!.mods).toEqual([]);
  });

  it('returns empty result when auto stat mods are off', () => {
    loSessionInfo = precalculateStructures(autoModData, [], [], false, armorStats);
    const setStats = [65, 42, 60, 76, 60, 87];
    // No constraint
    const desiredStatRanges = armorStats.map((statHash) => ({
      statHash,
      minStat: 0,
      maxStat: 200,
    }));

    const result = pickOptimalStatMods(
      loSessionInfo,
      modStatistics,
      items,
      setStats,
      desiredStatRanges,
    );

    expect(result).toBeDefined();
    expect(result!.bonusStats).toEqual([0, 0, 0, 0, 0, 0]);
    expect(result!.mods).toEqual([]);
  });
});
