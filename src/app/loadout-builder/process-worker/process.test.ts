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
import { ArmorStats, DesiredStatRange, MIN_LO_ITEM_ENERGY } from '../types';
import { process, ProcessInputs } from './process';
import { ProcessItem, ProcessItemsByBucket, ProcessMod, ProcessResult } from './types';

/**
 * Equivalence harness for the whole process() worker loop. The snapshots were
 * generated before the loop optimizations and pin down everything the UI can
 * observe, so optimized versions of the loop must reproduce them exactly.
 *
 * Deliberately excluded from the digest: numValidSets, skippedLowTier and
 * modsStatistics, because they depend on how full the top-200 heap is when a
 * set is considered, i.e. on iteration order, which optimizations are allowed
 * to change. The four combo-local skip reasons are summed rather than listed
 * because subtree-level pruning may reclassify a combo that fails several
 * checks at once; only the total is invariant. Sets are sorted by content
 * rather than kept in display order, because sets fully tied on all the
 * tracker's ordering keys may be displayed in any order among themselves.
 */
function digest(result: ProcessResult) {
  const { skipReasons } = result.processInfo.statistics;
  return {
    combos: result.combos,
    statRangesFiltered: result.statRangesFiltered,
    numProcessed: result.processInfo.numProcessed,
    lowerBoundsExceeded: result.processInfo.statistics.lowerBoundsExceeded,
    comboLocalSkips:
      skipReasons.doubleExotic +
      skipReasons.noExotic +
      skipReasons.insufficientPerks +
      skipReasons.insufficientSetBonus,
    sets: result.sets
      .map((s) => ({
        armor: s.armor,
        stats: s.stats,
        armorStats: s.armorStats,
        statMods: s.statMods,
        enabledStatsTotal: s.enabledStatsTotal,
        statsTotal: s.statsTotal,
        power: s.power,
      }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  };
}

const noProgress = () => {
  /* not used */
};

describe('process equivalence', () => {
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
              expandExoticTuning: false,
            })[0];
            if (mapped) {
              baseItems[bucketHash as keyof ProcessItemsByBucket].push(mapped);
            }
          }
        }
      }
    }
    // Deterministic corpus: sort by id, cap at 8 per bucket (8^5 = 32k combos)
    for (const bucketHash of Object.keys(baseItems)) {
      const items = baseItems[Number(bucketHash) as keyof ProcessItemsByBucket];
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

  // Each scenario gets a deep clone of the base inputs so patches don't leak.
  // ProcessInputs is plain JSON-safe data (it crosses the worker boundary).
  function cloneInputs(patch?: (inputs: ProcessInputs) => void): ProcessInputs {
    const inputs = JSON.parse(JSON.stringify(baseInputs)) as ProcessInputs;
    patch?.(inputs);
    return inputs;
  }

  function eachBucket(inputs: ProcessInputs, fn: (items: ProcessItem[]) => void) {
    for (const bucketHash of Object.keys(inputs.filteredItems)) {
      fn(inputs.filteredItems[Number(bucketHash) as keyof ProcessItemsByBucket]);
    }
  }

  async function runAndDigest(inputs: ProcessInputs) {
    let progressSum = 0;
    const result = await process(1, inputs, (delta) => {
      progressSum += delta;
    });
    // Progress accounting: every combo must be reported except the final
    // unflushed remainder of < 100k
    if (!inputs.stopOnFirstSet) {
      expect(result.combos - progressSum).toBeGreaterThanOrEqual(0);
      expect(result.combos - progressSum).toBeLessThan(100000);
    }
    return digest(result);
  }

  it('no constraints', async () => {
    expect(await runAndDigest(cloneInputs())).toMatchSnapshot();
  });

  it('stat minimums and maximums with auto stat mods', async () => {
    const inputs = cloneInputs((inputs) => {
      inputs.autoStatMods = true;
      inputs.desiredStatRanges = armorStats.map((statHash, i) => ({
        statHash,
        minStat: i < 2 ? 40 : 0,
        maxStat: i === 5 ? 0 : 100, // last stat ignored
      }));
    });
    expect(await runAndDigest(inputs)).toMatchSnapshot();
  });

  it('unreachable stat minimums exercise the lower-bounds prune', async () => {
    const inputs = cloneInputs((inputs) => {
      inputs.autoStatMods = true;
      inputs.desiredStatRanges = armorStats.map((statHash, i) => ({
        statHash,
        minStat: i < 3 ? 90 : 0,
        maxStat: 200,
      }));
    });
    expect(await runAndDigest(inputs)).toMatchSnapshot();
  });

  it('anyExotic with synthesized exotics', async () => {
    const inputs = cloneInputs((inputs) => {
      inputs.anyExotic = true;
      // Synthesize exotics so the corpus reliably exercises both exotic prunes
      inputs.filteredItems[BucketHashes.Helmet][0].isExotic = true;
      inputs.filteredItems[BucketHashes.Helmet][1].isExotic = true;
      inputs.filteredItems[BucketHashes.ChestArmor][0].isExotic = true;
      inputs.filteredItems[BucketHashes.LegArmor][3].isExotic = true;
    });
    expect(await runAndDigest(inputs)).toMatchSnapshot();
  });

  it('required perks', async () => {
    const inputs = cloneInputs((inputs) => {
      const fakePerk = 999999;
      inputs.filteredItems[BucketHashes.Helmet][0].intrinsicPerks = [fakePerk];
      inputs.filteredItems[BucketHashes.Helmet][2].intrinsicPerks = [fakePerk];
      inputs.filteredItems[BucketHashes.Gauntlets][1].intrinsicPerks = [fakePerk];
      inputs.filteredItems[BucketHashes.ClassArmor][0].intrinsicPerks = [fakePerk];
      inputs.requiredPerks = [{ hash: fakePerk, count: 2 }];
    });
    expect(await runAndDigest(inputs)).toMatchSnapshot();
  });

  it('set bonuses with wildcards', async () => {
    const inputs = cloneInputs((inputs) => {
      const setA = 111111;
      const setB = 222222;
      // Scatter set pieces across buckets, with some wildcard sockets
      eachBucket(inputs, (items) => {
        items[0].setBonus = setA;
        items[1].setBonus = setA;
        items[2].setBonus = setB;
        items[3].hasSetBonusModSocket = true;
      });
      inputs.setBonuses = { [setA]: 2, [setB]: 2 };
    });
    expect(await runAndDigest(inputs)).toMatchSnapshot();
  });

  it('set bonus satisfied only via wildcard', async () => {
    const inputs = cloneInputs((inputs) => {
      const setA = 111111;
      inputs.filteredItems[BucketHashes.Helmet][0].setBonus = setA;
      inputs.filteredItems[BucketHashes.Gauntlets][0].hasSetBonusModSocket = true;
      inputs.filteredItems[BucketHashes.ChestArmor][0].hasSetBonusModSocket = true;
      inputs.setBonuses = { [setA]: 2 };
    });
    expect(await runAndDigest(inputs)).toMatchSnapshot();
  });

  it('locked general and activity mods', async () => {
    const inputs = cloneInputs((inputs) => {
      inputs.autoStatMods = true;
      inputs.lockedMods = {
        generalMods: [generalMod, generalMod],
        activityMods: [activityMod],
      };
      // Give every item a chance to hold the activity mod
      eachBucket(inputs, (items) => {
        for (const item of items) {
          item.compatibleActivityMod = activityMod.tag;
        }
      });
    });
    expect(await runAndDigest(inputs)).toMatchSnapshot();
  });

  it('strict upgrades', async () => {
    const inputs = cloneInputs((inputs) => {
      inputs.strictUpgrades = true;
      inputs.autoStatMods = true;
      inputs.desiredStatRanges = armorStats.map((statHash, i) => ({
        statHash,
        minStat: i === 0 ? 50 : 0,
        maxStat: 150,
      }));
    });
    expect(await runAndDigest(inputs)).toMatchSnapshot();
  });

  it('stopOnFirstSet finds a set', async () => {
    const inputs = cloneInputs((inputs) => {
      inputs.stopOnFirstSet = true;
    });
    const result = await process(1, inputs, noProgress);
    // Which set is found first is iteration-order dependent; only existence matters
    expect(result.sets.length).toBeGreaterThan(0);
  });
});
