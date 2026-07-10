/**
 * Scenario corpus for the ablation benchmarks. BENCH BRANCH ONLY.
 *
 * Shared between the jest ablation runner (process.ablation.bench.test.ts) and
 * the fixture dump for the browser harness (ablation-fixtures.test.ts). This
 * module imports test utilities, so it must only ever be imported from test
 * files, never from anything reachable by an app bundle entry.
 */
import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { getBuckets } from 'app/destiny2/d2-buckets';
import { DimItem } from 'app/inventory/item-types';
import { buildStores } from 'app/inventory/store/d2-store-factory';
import { armorStats } from 'app/search/d2-known-values';
import { emptySet } from 'app/utils/empty';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import fs from 'node:fs';
// Bench-only module, imported exclusively from test files (see doc comment).
// eslint-disable-next-line no-restricted-imports
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { getAutoMods, mapAutoMods, mapDimItemToProcessItems } from '../process/mappers';
import { ArmorBucketHashes, DesiredStatRange, MIN_LO_ITEM_ENERGY } from '../types';
import { AblationFlag, ablationFlags } from './ablation-toggles';
import { ProcessInputs } from './process';
import { ProcessItem, ProcessItemsByBucket } from './types';

export interface Scenario {
  name: string;
  inputs: ProcessInputs;
  /** Flags whose ablation can matter in this scenario (others are skipped). */
  relevant?: AblationFlag[];
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface MakeItemsOpts {
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

export const minimums: DesiredStatRange[] = armorStats.map((statHash, i) => ({
  statHash,
  minStat: i === 0 || i === 1 ? 90 : i === 2 ? 60 : 0,
  maxStat: 200,
}));
export const showAll: DesiredStatRange[] = armorStats.map((statHash) => ({
  statHash,
  minStat: 0,
  maxStat: 200,
}));

const baseInputs = () => ({
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
});

function readProfileFixture(profilePath: string): DestinyProfileResponse {
  const raw = JSON.parse(fs.readFileSync(profilePath, 'utf-8')) as
    DestinyProfileResponse | { Response: DestinyProfileResponse };
  return 'Response' in raw ? raw.Response : raw;
}

export async function buildSyntheticScenarios(): Promise<Scenario[]> {
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
  const relevant = ablationFlags.filter((f) => f !== 'tuningPreGate');

  return [
    {
      name: 'synth minimums',
      relevant,
      inputs: {
        ...baseInputs(),
        filteredItems: items(makeRng(1234)),
        lockedMods: noMods,
        autoModOptions,
      },
    },
    {
      name: 'synth showAll',
      relevant,
      inputs: {
        ...baseInputs(),
        desiredStatRanges: showAll,
        filteredItems: items(makeRng(1234)),
        lockedMods: noMods,
        autoModOptions,
      },
    },
    {
      name: 'synth anyExotic',
      relevant,
      inputs: {
        ...baseInputs(),
        filteredItems: items(makeRng(1234)),
        lockedMods: noMods,
        anyExotic: true,
        autoModOptions,
      },
    },
    {
      name: 'synth mods+energy',
      relevant,
      inputs: {
        ...baseInputs(),
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
      relevant,
      inputs: {
        ...baseInputs(),
        filteredItems: items(makeRng(1234), { setBonusHash: 777, perkHash: 888 }),
        lockedMods: noMods,
        setBonuses: { 777: 2 },
        requiredPerks: [{ hash: 888, count: 2 }],
        autoModOptions,
      },
    },
  ];
}

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
  // Unlike the isArmor2* test predicates (legendary-only, no equippingLabel,
  // which silently exclude every exotic), admit any energy-bearing armor so
  // exotics and their tuning variants are represented like in production.
  const isBenchArmor = (item: DimItem, bucketHash: BucketHashes) =>
    Boolean(item.energy) && item.bucket.hash === bucketHash;
  const helmsByClass = new Map<number, number>();
  for (const store of stores) {
    for (const item of store.items) {
      if (isBenchArmor(item, BucketHashes.Helmet)) {
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
      for (const bucketHash of ArmorBucketHashes) {
        if (isBenchArmor(item, bucketHash)) {
          const mapped = mapDimItemToProcessItems({
            dimItem: item,
            armorEnergyRules,
            desiredStatRanges: minimums,
            autoStatMods: true,
          })[0];
          if (mapped) {
            filteredItems[bucketHash].push(mapped);
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

export async function buildVaultScenarios(perBucket: number): Promise<Scenario[]> {
  const { filteredItems, autoModOptions } = await loadRealVaultItems(perBucket);
  const noMods = { generalMods: [], activityMods: [] };
  return [
    {
      name: 'vault showAll',
      inputs: {
        ...baseInputs(),
        desiredStatRanges: showAll,
        filteredItems,
        lockedMods: noMods,
        autoModOptions,
      },
    },
    {
      name: 'vault minimums',
      inputs: { ...baseInputs(), filteredItems, lockedMods: noMods, autoModOptions },
    },
    {
      name: 'vault anyExotic',
      inputs: {
        ...baseInputs(),
        desiredStatRanges: showAll,
        filteredItems,
        lockedMods: noMods,
        anyExotic: true,
        autoModOptions,
      },
    },
  ];
}
