import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { armorStats } from 'app/search/d2-known-values';
import { emptySet } from 'app/utils/empty';
import { BucketHashes } from 'data/d2/generated-enums';
import {
  classStatModHash,
  enhancedOperatorAugmentModHash,
  isArmor2Arms,
  isArmor2Chest,
  isArmor2ClassItem,
  isArmor2Helmet,
  isArmor2Legs,
} from 'testing/test-item-utils';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import {
  getAutoMods,
  mapArmor2ModToProcessMod,
  mapAutoMods,
  mapDimItemToProcessItems,
} from '../process/mappers';
import { ArmorBucketHashes, ArmorStats, DesiredStatRange, MIN_LO_ITEM_ENERGY } from '../types';
import { process, ProcessInputs } from './process';
import { processBaseline } from './process-baseline';
import {
  ProcessArmorSet,
  ProcessItem,
  ProcessItemsByBucket,
  ProcessMod,
  ProcessResult,
} from './types';

/**
 * Correctness oracle for `process()` worker perf changes. `processBaseline` is
 * a frozen copy of the worker loop (see process-baseline.ts); `process` is the
 * candidate. A perf change that only reorders how sets are enumerated need not
 * be byte-for-byte equivalent — which equal-total sets fill the bottom of the
 * top-N heap is iteration-order dependent — so instead of snapshot equality
 * this asserts the invariants a correct optimization must keep exact:
 *
 *   - the retained top-N sets are identical (below tracker capacity: same
 *     armor + stats + mods; at capacity: same multiset of enabled-stat totals,
 *     and every set strictly above the worst retained total byte-identical),
 *   - every stat's observed maxStat is identical,
 *   - every stat's observed minStat is identical.
 *
 * With no candidate loaded (`process` === the baseline) every assertion holds
 * trivially; the harness earns its keep the moment `process.ts` is changed.
 */

/** A stable identity for a set, independent of heap display order. */
function setKey(s: ProcessArmorSet): string {
  return JSON.stringify({
    armor: [...s.armor].sort(),
    stats: s.stats,
    armorStats: s.armorStats,
    statMods: [...s.statMods].sort((a, b) => a - b),
    enabledStatsTotal: s.enabledStatsTotal,
  });
}

const noProgress = () => {
  /* not used */
};

describe('process candidate parity', () => {
  let baseItems: ProcessItemsByBucket;
  let baseInputs: ProcessInputs;
  let generalMod: ProcessMod;
  let activityMod: ProcessMod;

  const defaultRanges = (): DesiredStatRange[] =>
    armorStats.map((statHash) => ({ statHash, minStat: 0, maxStat: 200 }));

  beforeAll(async () => {
    const [defs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);

    const armorEnergyRules = {
      assumeArmorMasterwork: AssumeArmorMasterwork.None,
      minItemEnergy: MIN_LO_ITEM_ENERGY,
    };

    const buckets: [BucketHashes, (item: unknown) => boolean][] = [
      [BucketHashes.Helmet, isArmor2Helmet as (item: unknown) => boolean],
      [BucketHashes.Gauntlets, isArmor2Arms as (item: unknown) => boolean],
      [BucketHashes.ChestArmor, isArmor2Chest as (item: unknown) => boolean],
      [BucketHashes.LegArmor, isArmor2Legs as (item: unknown) => boolean],
      [BucketHashes.ClassArmor, isArmor2ClassItem as (item: unknown) => boolean],
    ];

    baseItems = {
      [BucketHashes.Helmet]: [],
      [BucketHashes.Gauntlets]: [],
      [BucketHashes.ChestArmor]: [],
      [BucketHashes.LegArmor]: [],
      [BucketHashes.ClassArmor]: [],
    };
    for (const store of stores) {
      for (const storeItem of store.items) {
        for (const [bucketHash, predicate] of buckets) {
          if (predicate(storeItem)) {
            const mapped = mapDimItemToProcessItems({
              dimItem: storeItem,
              armorEnergyRules,
              desiredStatRanges: defaultRanges(),
              autoStatMods: true,
            })[0];
            if (mapped) {
              baseItems[bucketHash as keyof ProcessItemsByBucket].push(mapped);
            }
          }
        }
      }
    }
    // Deterministic corpus: sort by id, cap at 8 per bucket (8^5 = 32k combos)
    for (const bucketHash of ArmorBucketHashes) {
      const items = baseItems[bucketHash];
      items.sort((a, b) => a.id.localeCompare(b.id));
      items.splice(8);
    }

    generalMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(classStatModHash) as PluggableInventoryItemDefinition,
    );
    activityMod = mapArmor2ModToProcessMod(
      defs.InventoryItem.get(enhancedOperatorAugmentModHash) as PluggableInventoryItemDefinition,
    );

    baseInputs = {
      filteredItems: baseItems,
      modStatTotals: Object.fromEntries(armorStats.map((h) => [h, 0])) as ArmorStats,
      lockedMods: { generalMods: [], activityMods: [] },
      setBonuses: {},
      requiredPerks: [],
      desiredStatRanges: defaultRanges(),
      anyExotic: false,
      autoModOptions: mapAutoMods(getAutoMods(defs, emptySet())),
      autoStatMods: false,
      strictUpgrades: false,
      stopOnFirstSet: false,
    };
  });

  function cloneInputs(patch?: (inputs: ProcessInputs) => void): ProcessInputs {
    const inputs = JSON.parse(JSON.stringify(baseInputs)) as ProcessInputs;
    patch?.(inputs);
    return inputs;
  }

  function eachBucket(inputs: ProcessInputs, fn: (items: ProcessItem[]) => void) {
    for (const bucketHash of ArmorBucketHashes) {
      fn(inputs.filteredItems[bucketHash]);
    }
  }

  /** Assert the sets/maxStat invariants of `candidate` against `base`. */
  function assertSetsAndMax(base: ProcessResult, candidate: ProcessResult) {
    for (const statHash of armorStats) {
      const b = base.statRangesFiltered[statHash];
      const p = candidate.statRangesFiltered[statHash];
      expect({ statHash, maxStat: p.maxStat }).toEqual({ statHash, maxStat: b.maxStat });
    }

    const belowCapacity = base.sets.length < 200 && candidate.sets.length < 200;
    if (belowCapacity) {
      // Every candidate fits, so the retained sets must be identical.
      expect(candidate.sets.map(setKey).sort()).toEqual(base.sets.map(setKey).sort());
    } else {
      // At capacity, the multiset of retained totals must match (no genuinely
      // higher-total set is ever lost)...
      expect(candidate.sets.length).toBe(base.sets.length);
      const baseTotals = base.sets.map((s) => s.enabledStatsTotal).sort((a, b) => a - b);
      const totals = candidate.sets.map((s) => s.enabledStatsTotal).sort((a, b) => a - b);
      expect(totals).toEqual(baseTotals);

      // ...and every set unambiguously inside the top-N (strictly above the
      // worst retained total) must be byte-identical. Only sets tied at the
      // boundary total may churn, since which of several equal-total sets fills
      // the last slots is iteration-order dependent.
      const boundary = baseTotals[0];
      const above = (r: ProcessResult) =>
        r.sets
          .filter((s) => s.enabledStatsTotal > boundary)
          .map(setKey)
          .sort();
      expect(above(candidate)).toEqual(above(base));
    }
  }

  // Run the frozen baseline and the candidate on identical inputs (each gets
  // its own deep clone, since process() sorts the item arrays in place) and
  // assert the parity invariants.
  async function assertParity(makeInputs: () => ProcessInputs) {
    const base = await processBaseline(1, makeInputs(), noProgress);
    const candidate = await process(1, makeInputs(), noProgress);

    // Sets + max stat ranges are identical...
    assertSetsAndMax(base, candidate);

    // ...and so is every stat's observed minStat.
    for (const statHash of armorStats) {
      const b = base.statRangesFiltered[statHash];
      const p = candidate.statRangesFiltered[statHash];
      expect({ statHash, minStat: p.minStat }).toEqual({ statHash, minStat: b.minStat });
    }

    return { base, candidate };
  }

  it('no constraints', async () => {
    await assertParity(() => cloneInputs());
  });

  it('stat minimums and maximums with auto stat mods', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        inputs.autoStatMods = true;
        inputs.desiredStatRanges = armorStats.map((statHash, i) => ({
          statHash,
          minStat: i < 2 ? 40 : 0,
          maxStat: i === 5 ? 0 : 100,
        }));
      }),
    );
  });

  it('unreachable stat minimums exercise the lower-bounds prune', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        inputs.autoStatMods = true;
        inputs.desiredStatRanges = armorStats.map((statHash, i) => ({
          statHash,
          minStat: i < 3 ? 90 : 0,
          maxStat: 200,
        }));
      }),
    );
  });

  it('anyExotic with synthesized exotics', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        inputs.anyExotic = true;
        inputs.filteredItems[BucketHashes.Helmet][0].isExotic = true;
        inputs.filteredItems[BucketHashes.Helmet][1].isExotic = true;
        inputs.filteredItems[BucketHashes.ChestArmor][0].isExotic = true;
        inputs.filteredItems[BucketHashes.LegArmor][3].isExotic = true;
      }),
    );
  });

  it('required perks', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        const fakePerk = 999999;
        inputs.filteredItems[BucketHashes.Helmet][0].intrinsicPerks = [fakePerk];
        inputs.filteredItems[BucketHashes.Helmet][2].intrinsicPerks = [fakePerk];
        inputs.filteredItems[BucketHashes.Gauntlets][1].intrinsicPerks = [fakePerk];
        inputs.filteredItems[BucketHashes.ClassArmor][0].intrinsicPerks = [fakePerk];
        inputs.requiredPerks = [{ hash: fakePerk, count: 2 }];
      }),
    );
  });

  it('set bonuses with wildcards', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        const setA = 111111;
        const setB = 222222;
        eachBucket(inputs, (items) => {
          items[0].setBonus = setA;
          items[1].setBonus = setA;
          items[2].setBonus = setB;
          items[3].hasSetBonusModSocket = true;
        });
        inputs.setBonuses = { [setA]: 2, [setB]: 2 };
      }),
    );
  });

  it('set bonus satisfied only via wildcard', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        const setA = 111111;
        inputs.filteredItems[BucketHashes.Helmet][0].setBonus = setA;
        inputs.filteredItems[BucketHashes.Gauntlets][0].hasSetBonusModSocket = true;
        inputs.filteredItems[BucketHashes.ChestArmor][0].hasSetBonusModSocket = true;
        inputs.setBonuses = { [setA]: 2 };
      }),
    );
  });

  it('locked general and activity mods', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        inputs.autoStatMods = true;
        inputs.lockedMods = {
          generalMods: [generalMod, generalMod],
          activityMods: [activityMod],
        };
        eachBucket(inputs, (items) => {
          for (const item of items) {
            item.compatibleActivityMod = activityMod.tag;
          }
        });
      }),
    );
  });

  it('strict upgrades', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        inputs.strictUpgrades = true;
        inputs.autoStatMods = true;
        inputs.desiredStatRanges = armorStats.map((statHash, i) => ({
          statHash,
          minStat: i === 0 ? 50 : 0,
          maxStat: 150,
        }));
      }),
    );
  });

  // A directional (+5/-5) and a balanced-style (+1/+1/+1) tuning variant.
  const makeVariants = (exotic: ProcessItem) => {
    const statA = armorStats[1];
    const statB = armorStats[4];
    return [
      {
        modHash: 111,
        stats: {
          ...exotic.stats,
          [statA]: exotic.stats[statA] + 5,
          [statB]: exotic.stats[statB] - 5,
        },
      },
      {
        modHash: 222,
        stats: {
          ...exotic.stats,
          [armorStats[0]]: exotic.stats[armorStats[0]] + 1,
          [statA]: exotic.stats[statA] + 1,
          [statB]: exotic.stats[statB] + 1,
        },
      },
    ];
  };

  it('tail-resolved exotic tuning variants (below capacity)', async () => {
    const { candidate } = await assertParity(() =>
      cloneInputs((inputs) => {
        inputs.autoStatMods = true;
        inputs.desiredStatRanges[0].minStat = 20;
        eachBucket(inputs, (items) => items.splice(2));
        const exotic = inputs.filteredItems[BucketHashes.Helmet][0];
        exotic.isExotic = true;
        exotic.tuningVariants = makeVariants(exotic);
      }),
    );
    // The tuning mod actually shows up in the returned sets.
    expect(candidate.sets.some((s) => s.statMods.includes(111) || s.statMods.includes(222))).toBe(
      true,
    );
  });

  it('tail-resolved tuning with the tracker boundary active', async () => {
    await assertParity(() =>
      cloneInputs((inputs) => {
        inputs.autoStatMods = true;
        for (const [bucketHash, idx] of [
          [BucketHashes.Helmet, 0],
          [BucketHashes.Helmet, 3],
          [BucketHashes.ChestArmor, 2],
        ] as const) {
          const item = inputs.filteredItems[bucketHash][idx];
          item.isExotic = true;
          item.tuningVariants = makeVariants(item);
        }
      }),
    );
  });
});
