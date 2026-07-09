/**
 * Ablation benchmark for individual LO optimizations. BENCH BRANCH ONLY.
 *
 * For each (scenario, toggle) pair this interleaves process() with the toggle
 * ON and OFF within each round and reports min-over-rounds for both, so the
 * ratio is immune to this machine's clock drift. All other toggles stay ON, so
 * each number is "what does removing just this optimization cost on top of the
 * current code".
 *
 * Run with:
 *   change test.skip -> test below, then
 *   npx jest process.ablation --silent=false
 *
 * Env:
 *   LO_BENCH_PROFILE=path  real profile JSON for the real-vault scenarios
 *                          (falls back to the checked-in test stores)
 *   LO_BENCH_ITEMS=n       per-bucket cap for real-vault scenarios (default 25)
 *   LO_BENCH_ROUNDS=n      rounds per pair (default 5)
 *   LO_ABLATE=a,b          handled by ablation-toggles.ts; don't combine with
 *                          this test, which drives the toggles itself
 */
import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { getBuckets } from 'app/destiny2/d2-buckets';
import { DimItem } from 'app/inventory/item-types';
import { buildStores } from 'app/inventory/store/d2-store-factory';
import { armorStats } from 'app/search/d2-known-values';
import { emptySet } from 'app/utils/empty';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
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
import { ablation, AblationFlag, ablationFlags } from './ablation-toggles';
import { process as processArmor, ProcessInputs } from './process';
import { ProcessItem, ProcessItemsByBucket, ProcessResult } from './types';

const ROUNDS = Number(process.env.LO_BENCH_ROUNDS) || 5;
const PER_BUCKET = Number(process.env.LO_BENCH_ITEMS) || 25;

// ---------------------------------------------------------------------------
// Corpus builders (mirrors process.bench.test.ts, plus set bonus/perk options)
// ---------------------------------------------------------------------------

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface MakeItemsOpts {
  activityTag?: string;
  minEnergy?: number;
  /** Give ~50% of items this set bonus, ~20% a wildcard socket. */
  setBonusHash?: number;
  /** Give ~40% of items this intrinsic perk. */
  perkHash?: number;
}

function makeItems(
  bucket: number,
  count: number,
  rng: () => number,
  opts?: MakeItemsOpts,
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
      setBonus: opts?.setBonusHash !== undefined && rng() < 0.5 ? opts.setBonusHash : undefined,
      hasSetBonusModSocket: opts?.setBonusHash !== undefined && rng() < 0.2,
      intrinsicPerks: opts?.perkHash !== undefined && rng() < 0.4 ? [opts.perkHash] : undefined,
    };
  });
}

const clone = (inputs: ProcessInputs): ProcessInputs =>
  JSON.parse(JSON.stringify(inputs)) as ProcessInputs;

const minimums: DesiredStatRange[] = armorStats.map((statHash, i) => ({
  statHash,
  minStat: i === 0 || i === 1 ? 90 : i === 2 ? 60 : 0,
  maxStat: 200,
}));
const showAll: DesiredStatRange[] = armorStats.map((statHash) => ({
  statHash,
  minStat: 0,
  maxStat: 200,
}));

const baseInputs = {
  modStatTotals: Object.fromEntries(
    armorStats.map((h) => [h, 0]),
  ) as ProcessInputs['modStatTotals'],
  setBonuses: {},
  requiredPerks: [],
  desiredStatRanges: minimums,
  anyExotic: false,
  autoStatMods: true,
  strictUpgrades: false,
  stopOnFirstSet: false,
};

async function loadRealVaultItems(perBucket: number): Promise<{
  filteredItems: ProcessItemsByBucket;
  autoModOptions: ProcessInputs['autoModOptions'];
}> {
  const defs = await getTestDefinitions();
  const profilePath = process.env.LO_BENCH_PROFILE;
  const stores = profilePath
    ? buildStores({
        defs,
        buckets: getBuckets(defs),
        profileResponse: readProfileFixture(profilePath),
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
            desiredStatRanges: minimums,
            autoStatMods: true,
          })[0];
          if (mapped) {
            filteredItems[bucketHash as keyof ProcessItemsByBucket].push(mapped);
          }
        }
      }
    }
  }
  for (const bucketHash of ArmorBucketHashes) {
    const items = filteredItems[bucketHash];
    items.sort(
      (a, b) =>
        armorStats.reduce((t, h) => t + b.stats[h], 0) -
        armorStats.reduce((t, h) => t + a.stats[h], 0),
    );
    items.splice(perBucket);
  }
  return { filteredItems, autoModOptions };
}

function readProfileFixture(profilePath: string): DestinyProfileResponse {
  const raw = JSON.parse(fs.readFileSync(profilePath, 'utf-8')) as
    DestinyProfileResponse | { Response: DestinyProfileResponse };
  return 'Response' in raw ? raw.Response : raw;
}

// ---------------------------------------------------------------------------
// Ablation runner
// ---------------------------------------------------------------------------

interface Scenario {
  name: string;
  inputs: ProcessInputs;
  /** Flags whose ablation can matter in this scenario (others are skipped). */
  relevant?: AblationFlag[];
}

async function timeOnce(inputs: ProcessInputs): Promise<[number, ProcessResult]> {
  const inp = clone(inputs);
  const start = performance.now();
  const result = await processArmor(0, inp, noop);
  return [performance.now() - start, result];
}

function fmtCounters(result: ProcessResult): string {
  const s = result.processInfo.statistics.skipReasons;
  return `subtree ${s.subtreePruned} tuningGate ${s.tuningGatePruned} trackerFloor ${s.trackerFloorPruned} lowTier ${s.skippedLowTier} dblExotic ${s.doubleExotic} noExotic ${s.noExotic} perks ${s.insufficientPerks} setBonus ${s.insufficientSetBonus}`;
}

async function runScenario(scenario: Scenario, flags: AblationFlag[]) {
  const { name, inputs } = scenario;
  // Warm both hot-path shapes.
  await timeOnce(inputs);
  const [, allOnResult] = await timeOnce(inputs);
  // eslint-disable-next-line no-console
  console.log(
    `\n=== ${name}: combos ${allOnResult.combos} | valid ${allOnResult.processInfo.numValidSets} | returned ${allOnResult.sets.length}\n    counters: ${fmtCounters(allOnResult)}`,
  );

  for (const flag of flags) {
    if (scenario.relevant && !scenario.relevant.includes(flag)) {
      continue;
    }
    const onTimes: number[] = [];
    const offTimes: number[] = [];
    let offResult: ProcessResult | undefined;
    try {
      // Warm the OFF shape too before timing it.
      ablation[flag] = false;
      await timeOnce(inputs);
      ablation[flag] = true;

      for (let round = 0; round < ROUNDS; round++) {
        ablation[flag] = true;
        const [tOn] = await timeOnce(inputs);
        onTimes.push(tOn);
        ablation[flag] = false;
        const [tOff, r] = await timeOnce(inputs);
        offTimes.push(tOff);
        offResult ??= r;
      }
    } finally {
      ablation[flag] = true;
    }

    // Every toggle except strictBeat must be result-preserving.
    if (flag !== 'strictBeat' && offResult) {
      expect(offResult.processInfo.numValidSets).toBe(allOnResult.processInfo.numValidSets);
      expect(offResult.sets.length).toBe(allOnResult.sets.length);
      expect(offResult.statRangesFiltered).toEqual(allOnResult.statRangesFiltered);
    }

    onTimes.sort((a, b) => a - b);
    offTimes.sort((a, b) => a - b);
    const cost = offTimes[0] / onTimes[0];
    // eslint-disable-next-line no-console
    console.log(
      `ABL ${name} | ${flag.padEnd(17)} on ${onTimes[0].toFixed(1).padStart(7)}ms  off ${offTimes[0]
        .toFixed(1)
        .padStart(7)}ms  removal costs ${cost.toFixed(2)}x  (on ${onTimes
        .map((t) => t.toFixed(0))
        .join(' ')} | off ${offTimes.map((t) => t.toFixed(0)).join(' ')})`,
    );
  }
}

test.skip('ablation: synthetic scenarios', async () => {
  const defs = await getTestDefinitions();
  const autoModOptions = mapAutoMods(getAutoMods(defs, emptySet()));
  const items = (rng: () => number, opts?: MakeItemsOpts) => ({
    [BucketHashes.Helmet]: makeItems(0, 18, rng, opts),
    [BucketHashes.Gauntlets]: makeItems(1, 18, rng, opts),
    [BucketHashes.ChestArmor]: makeItems(2, 18, rng, opts),
    [BucketHashes.LegArmor]: makeItems(3, 18, rng, opts),
    [BucketHashes.ClassArmor]: makeItems(4, 4, rng, opts),
  });
  const noMods = { generalMods: [], activityMods: [] };

  // tuningPreGate needs tuningVariants, which synthetic items don't have.
  const synthFlags = ablationFlags.filter((f) => f !== 'tuningPreGate');

  const scenarios: Scenario[] = [
    {
      name: 'synth minimums',
      inputs: {
        ...baseInputs,
        filteredItems: items(makeRng(1234)),
        lockedMods: noMods,
        autoModOptions,
      },
    },
    {
      name: 'synth showAll',
      inputs: {
        ...baseInputs,
        desiredStatRanges: showAll,
        filteredItems: items(makeRng(1234)),
        lockedMods: noMods,
        autoModOptions,
      },
    },
    {
      name: 'synth anyExotic',
      inputs: {
        ...baseInputs,
        filteredItems: items(makeRng(1234)),
        lockedMods: noMods,
        anyExotic: true,
        autoModOptions,
      },
    },
    {
      name: 'synth mods+energy',
      inputs: {
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
      },
    },
    {
      name: 'synth setBonus+perks',
      inputs: {
        ...baseInputs,
        filteredItems: items(makeRng(1234), { setBonusHash: 777, perkHash: 888 }),
        lockedMods: noMods,
        setBonuses: { 777: 2 },
        requiredPerks: [{ hash: 888, count: 2 }],
        autoModOptions,
      },
    },
  ];

  for (const scenario of scenarios) {
    await runScenario(scenario, synthFlags);
  }
}, 600000);

test.skip('ablation: real vault scenarios', async () => {
  const { filteredItems, autoModOptions } = await loadRealVaultItems(PER_BUCKET);
  const noMods = { generalMods: [], activityMods: [] };
  // eslint-disable-next-line no-console
  console.log(
    `real vault items/bucket ${ArmorBucketHashes.map((h) => filteredItems[h].length).join('/')}${process.env.LO_BENCH_PROFILE ? '' : ' (checked-in test fixture; set LO_BENCH_PROFILE for a real vault)'}`,
  );

  const scenarios: Scenario[] = [
    {
      name: 'vault showAll',
      inputs: {
        ...baseInputs,
        desiredStatRanges: showAll,
        filteredItems,
        lockedMods: noMods,
        autoModOptions,
      },
    },
    {
      name: 'vault minimums',
      inputs: { ...baseInputs, filteredItems, lockedMods: noMods, autoModOptions },
    },
    {
      name: 'vault anyExotic',
      inputs: {
        ...baseInputs,
        desiredStatRanges: showAll,
        filteredItems,
        lockedMods: noMods,
        anyExotic: true,
        autoModOptions,
      },
    },
  ];

  for (const scenario of scenarios) {
    await runScenario(scenario, ablationFlags);
  }
}, 600000);
