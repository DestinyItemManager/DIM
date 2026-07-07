/**
 * Manual A/B benchmark for the LO process worker. Not a correctness test — it's
 * skipped by default so it doesn't slow down CI. To run:
 *
 *   change test.skip -> test below, then
 *   npx jest process.bench --silent=false
 *
 * It interleaves the frozen pre-pareto implementation (`processBaseline`, the
 * #11862 code) against the current meet-in-the-middle `process` WITHIN each
 * round, and reports the min over rounds. This machine's clock speed drifts
 * ~2.5x over minutes (load/thermal), so only compare the two numbers printed by
 * a single run — never runs taken minutes apart. Each timed call gets a fresh
 * clone of the inputs, because the baseline sorts the item arrays in place.
 *
 * Correctness is covered by process-parity.test.ts; here the logged valid-set
 * and returned-set counts are just a sanity signal that the two are solving the
 * same problem.
 */
import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { getBuckets } from 'app/destiny2/d2-buckets';
import { DimItem } from 'app/inventory/item-types';
import { buildStores } from 'app/inventory/store/d2-store-factory';
import { armorStats } from 'app/search/d2-known-values';
import { emptySet } from 'app/utils/empty';
import { BucketHashes } from 'data/d2/generated-enums';
import { noop } from 'es-toolkit';
import fs from 'node:fs';
import {
  isArmor2Arms,
  isArmor2Chest,
  isArmor2ClassItem,
  isArmor2Helmet,
  isArmor2Legs,
} from 'testing/test-item-utils';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { getAutoMods, mapAutoMods, mapDimItemToProcessItems } from '../process/mappers';
import { ArmorBucketHashes, DesiredStatRange, MIN_LO_ITEM_ENERGY } from '../types';
import { process as processArmor, ProcessInputs } from './process';
import { processBaseline } from './process-baseline';
import { ProcessItem, ProcessItemsByBucket } from './types';

// Deterministic LCG so runs are comparable
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeItems(
  bucket: number,
  count: number,
  rng: () => number,
  opts?: { activityTag?: string; minEnergy?: number },
): ProcessItem[] {
  const minEnergy = opts?.minEnergy ?? 10;
  return Array.from({ length: count }, (_, i): ProcessItem => {
    const stats: { [statHash: number]: number } = {};
    for (const statHash of armorStats) {
      stats[statHash] = 5 + Math.floor(rng() * 25); // 5..29
    }
    return {
      id: `${bucket}-${i}`,
      name: `Item ${bucket}-${i}`,
      isExotic: i === 0,
      isArtifice: rng() < 0.4,
      remainingEnergyCapacity:
        minEnergy < 10 ? minEnergy + Math.floor(rng() * (11 - minEnergy)) : 10,
      power: 1500,
      stats,
      compatibleActivityMod: opts?.activityTag && rng() < 0.6 ? opts.activityTag : undefined,
    };
  });
}

const clone = (inputs: ProcessInputs): ProcessInputs =>
  JSON.parse(JSON.stringify(inputs)) as ProcessInputs;

async function runAB(name: string, inputs: ProcessInputs) {
  // Warm up both JITs.
  await processBaseline(0, clone(inputs), noop);
  await processArmor(0, clone(inputs), noop);

  const baseTimes: number[] = [];
  const paretoTimes: number[] = [];
  for (let run = 0; run < 7; run++) {
    // Interleave within the round so thermal drift hits both roughly equally.
    const bIn = clone(inputs);
    let start = performance.now();
    const bResult = await processBaseline(0, bIn, noop);
    baseTimes.push(performance.now() - start);

    const pIn = clone(inputs);
    start = performance.now();
    const pResult = await processArmor(0, pIn, noop);
    paretoTimes.push(performance.now() - start);

    if (run === 0) {
      // eslint-disable-next-line no-console
      console.log(
        `${name}: combos ${bResult.combos} | valid sets base ${bResult.processInfo.numValidSets} pareto ${pResult.processInfo.numValidSets} | returned base ${bResult.sets.length} pareto ${pResult.sets.length}`,
      );
    }
  }
  baseTimes.sort((a, b) => a - b);
  paretoTimes.sort((a, b) => a - b);
  const speedup = baseTimes[0] / paretoTimes[0];
  // eslint-disable-next-line no-console
  console.log(
    `BENCH ${name}: base min ${baseTimes[0].toFixed(0)}ms | pareto min ${paretoTimes[0].toFixed(0)}ms | ${speedup.toFixed(2)}x` +
      `  (base all ${baseTimes.map((t) => t.toFixed(0)).join(' ')} | pareto all ${paretoTimes.map((t) => t.toFixed(0)).join(' ')})`,
  );
}

// Minimums above the average set stat total so the auto-mod solver has to work
// for a large fraction of sets.
const desiredStatRanges: DesiredStatRange[] = armorStats.map((statHash, i) => ({
  statHash,
  minStat: i === 0 || i === 1 ? 90 : i === 2 ? 60 : 0,
  maxStat: 200,
}));

const baseInputs = {
  modStatTotals: Object.fromEntries(
    armorStats.map((h) => [h, 0]),
  ) as ProcessInputs['modStatTotals'],
  setBonuses: {},
  requiredPerks: [],
  desiredStatRanges,
  anyExotic: false,
  autoStatMods: true,
  strictUpgrades: false,
  stopOnFirstSet: false,
};

test.skip('benchmark process(): baseline vs pareto', async () => {
  const defs = await getTestDefinitions();
  const autoModOptions = mapAutoMods(getAutoMods(defs, emptySet()));

  const items = (rng: () => number, opts?: { activityTag?: string; minEnergy?: number }) => ({
    [BucketHashes.Helmet]: makeItems(0, 18, rng, opts),
    [BucketHashes.Gauntlets]: makeItems(1, 18, rng, opts),
    [BucketHashes.ChestArmor]: makeItems(2, 18, rng, opts),
    [BucketHashes.LegArmor]: makeItems(3, 18, rng, opts),
    [BucketHashes.ClassArmor]: makeItems(4, 4, rng, opts),
  });

  await runAB('unconstrained', {
    ...baseInputs,
    filteredItems: items(makeRng(1234)),
    lockedMods: { generalMods: [], activityMods: [] },
    autoModOptions,
  });

  await runAB('anyExotic', {
    ...baseInputs,
    filteredItems: items(makeRng(1234)),
    lockedMods: { generalMods: [], activityMods: [] },
    anyExotic: true,
    autoModOptions,
  });

  await runAB('constrained (mods + tight energy)', {
    ...baseInputs,
    filteredItems: items(makeRng(1234), { activityTag: 'bench', minEnergy: 4 }),
    lockedMods: {
      generalMods: [
        { hash: 1001, energyCost: 3 },
        { hash: 1002, energyCost: 4 },
      ],
      activityMods: [
        { hash: 2001, energyCost: 1, tag: 'bench' },
        { hash: 2002, energyCost: 2, tag: 'bench' },
        { hash: 2003, energyCost: 3, tag: 'bench' },
      ],
    },
    autoModOptions,
  });
}, 300000);

// Real-vault A/B: build the corpus from the checked-in Bungie profile fixture
// (real, correlated armor rolls) rather than uniform-random synthetic stats.
// This is the honest test of the meet-in-the-middle frontier sizes — dominated
// pairs are far more common with correlated rolls. Items are taken for the
// class with the most helmets and capped per bucket to keep baseline runtime
// bearable across rounds; bump PER_BUCKET (or drop in a bigger profile) to
// stress it harder.
const PER_BUCKET = Number(process.env.LO_BENCH_ITEMS) || 25;
test.skip('benchmark process(): real vault', async () => {
  const defs = await getTestDefinitions();
  // LO_BENCH_PROFILE can point at a raw Bungie GetProfile response (or one
  // wrapped in { Response }); otherwise fall back to the checked-in fixture.
  const profilePath = process.env.LO_BENCH_PROFILE;
  const stores = profilePath
    ? buildStores({
        defs,
        buckets: getBuckets(defs),
        profileResponse: (() => {
          const raw = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
          return raw.Response ?? raw;
        })(),
        customStats: [],
      })
    : await getTestStores();
  const autoModOptions = mapAutoMods(getAutoMods(defs, emptySet()));
  const armorEnergyRules = {
    assumeArmorMasterwork: AssumeArmorMasterwork.None,
    minItemEnergy: MIN_LO_ITEM_ENERGY,
  };

  const bucketPredicates: [BucketHashes, (item: DimItem) => unknown][] = [
    [BucketHashes.Helmet, isArmor2Helmet],
    [BucketHashes.Gauntlets, isArmor2Arms],
    [BucketHashes.ChestArmor, isArmor2Chest],
    [BucketHashes.LegArmor, isArmor2Legs],
    [BucketHashes.ClassArmor, isArmor2ClassItem],
  ];

  // Pick the class that has the most helmets in the fixture.
  const helmsByClass = new Map<number, number>();
  for (const store of stores) {
    for (const item of store.items) {
      if (isArmor2Helmet(item)) {
        helmsByClass.set(item.classType, (helmsByClass.get(item.classType) ?? 0) + 1);
      }
    }
  }
  const classType = [...helmsByClass.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const filteredItems: ProcessItemsByBucket = {
    [BucketHashes.Helmet]: [],
    [BucketHashes.Gauntlets]: [],
    [BucketHashes.ChestArmor]: [],
    [BucketHashes.LegArmor]: [],
    [BucketHashes.ClassArmor]: [],
  };
  for (const store of stores) {
    for (const item of store.items) {
      if (item.classType !== classType) {
        continue;
      }
      for (const [bucketHash, predicate] of bucketPredicates) {
        if (predicate(item)) {
          const mapped = mapDimItemToProcessItems({
            dimItem: item,
            armorEnergyRules,
            desiredStatRanges,
            autoStatMods: true,
          })[0];
          if (mapped) {
            filteredItems[bucketHash as keyof ProcessItemsByBucket].push(mapped);
          }
        }
      }
    }
  }
  // Deterministic cap per bucket (highest total stats first, like useProcess).
  for (const bucketHash of ArmorBucketHashes) {
    const items = filteredItems[bucketHash];
    items.sort(
      (a, b) =>
        armorStats.reduce((t, h) => t + b.stats[h], 0) -
        armorStats.reduce((t, h) => t + a.stats[h], 0),
    );
    items.splice(PER_BUCKET);
  }
  // eslint-disable-next-line no-console
  console.log(
    `real vault: classType ${classType}, items/bucket`,
    ArmorBucketHashes.map((h) => filteredItems[h].length).join('/'),
  );

  await runAB('real vault', {
    ...baseInputs,
    filteredItems,
    lockedMods: { generalMods: [], activityMods: [] },
    autoModOptions,
  });
}, 300000);
