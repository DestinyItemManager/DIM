import { armorStats } from 'app/search/d2-known-values';
import { StatHashes } from 'data/d2/generated-enums';
import { ArmorStatHashes, ArmorStats, DesiredStatRange } from '../types';
import {
  HypotheticalArmorBlock,
  planBestComposition,
  planMinimumAcquisitions,
  PlannerOwnedPiece,
  zeroArmorStats,
} from './hypothetical-items';

/**
 * Synthetic-fixture tests for the acquisition planner — no manifest needed.
 * These cover the areas the code review flagged as bug-rich: pins, set-bonus
 * deficits, the ideal-bound fallback, and mod/energy accounting.
 */

const G = StatHashes.Grenade as ArmorStatHashes;
const S = StatHashes.Super as ArmorStatHashes;
const C = StatHashes.Class as ArmorStatHashes;
const M = StatHashes.Melee as ArmorStatHashes;
const H = StatHashes.Health as ArmorStatHashes;
const W = StatHashes.Weapons as ArmorStatHashes;

/** A tier-5-shaped hypothetical block: primary 30 / secondary 25 / tertiary 20 / rest 5. */
function makeBlock(
  primary: ArmorStatHashes,
  secondary: ArmorStatHashes,
  tertiary: ArmorStatHashes,
  plugHash: number,
): HypotheticalArmorBlock {
  const stats = zeroArmorStats();
  for (const statHash of armorStats) {
    stats[statHash] = 5;
  }
  stats[primary] = 30;
  stats[secondary] = 25;
  stats[tertiary] = 20;
  return {
    name: `block-${plugHash}-${tertiary}`,
    archetypePlugHash: plugHash,
    archetypeName: `archetype-${plugHash}`,
    tertiaryStatHash: tertiary,
    stats,
  };
}

const BLOCKS = [
  makeBlock(G, S, C, 1),
  makeBlock(G, C, S, 2),
  makeBlock(S, G, M, 3),
  makeBlock(H, C, W, 4),
];

function makeOwned(
  name: string,
  statValues: Partial<Record<ArmorStatHashes, number>>,
  extra?: Partial<PlannerOwnedPiece>,
): PlannerOwnedPiece {
  const stats = zeroArmorStats();
  for (const statHash of armorStats) {
    const value = statValues[statHash];
    if (value !== undefined) {
      stats[statHash] = value;
    }
  }
  return { name, stats, ...extra };
}

function makeRanges(targets: Partial<Record<ArmorStatHashes, number>>): DesiredStatRange[] {
  return armorStats.map((statHash) => ({
    statHash,
    minStat: targets[statHash] ?? 0,
    maxStat: 200,
  }));
}

const farmTotal = (plan: { farm: { count: number }[] }) =>
  plan.farm.reduce((total, { count }) => total + count, 0);

const modTotal = (mods: ArmorStats) => armorStats.reduce((total, h) => total + mods[h], 0);

describe('planMinimumAcquisitions', () => {
  it('keeps owned pieces and farms nothing when targets are already met', () => {
    const ownedByBucket = Array.from({ length: 5 }, (_, i) => [
      makeOwned(`owned-${i}`, { [G]: 20 }),
    ]);
    const plan = planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 100 }),
      ownedByBucket,
      numGeneralMods: 0,
    });
    expect(plan.shortfall).toBe(0);
    expect(farmTotal(plan)).toBe(0);
    expect(plan.keep).toHaveLength(5);
  });

  it('farms the minimum number of new pieces', () => {
    // Owned pieces give 10 Grenade each, ideal drops 30. Target 110 requires
    // 10k + 30(5-k) >= 110, so at most 2 owned pieces can stay.
    const ownedByBucket = Array.from({ length: 5 }, (_, i) => [
      makeOwned(`owned-${i}`, { [G]: 10 }),
    ]);
    const plan = planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 110 }),
      ownedByBucket,
      numGeneralMods: 0,
    });
    expect(plan.shortfall).toBe(0);
    expect(farmTotal(plan)).toBe(3);
    expect(plan.keep).toHaveLength(2);
  });

  it('honors pinned slots even when the pinned piece is bad', () => {
    // The pin contributes nothing toward the target, so more must be farmed.
    const pinned = makeOwned('pinned', { [W]: 30 });
    const ownedByBucket = [
      [pinned],
      ...Array.from({ length: 4 }, (_, i) => [makeOwned(`owned-${i}`, { [G]: 10 })]),
    ];
    const plan = planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 110 }),
      ownedByBucket,
      requiredSlots: [0],
      numGeneralMods: 0,
    });
    expect(plan.shortfall).toBe(0);
    expect(plan.keep.map((p) => p.name)).toContain('pinned');
    // 0 + 10k + 30(4-k) >= 110 forces k = 0: keep only the pin, farm 4.
    expect(farmTotal(plan)).toBe(4);
  });

  it('counts how many farmed pieces must come from a required set', () => {
    const SET = 111;
    const ownedByBucket = [
      [makeOwned('set-piece-1', { [G]: 20 }, { setBonusHash: SET })],
      [makeOwned('set-piece-2', { [G]: 20 }, { setBonusHash: SET })],
      [],
      [],
      [],
    ];
    const plan = planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 100 }),
      ownedByBucket,
      setBonusRequirements: [{ setHash: SET, count: 4 }],
      numGeneralMods: 0,
    });
    expect(plan.shortfall).toBe(0);
    expect(plan.keep).toHaveLength(2);
    expect(farmTotal(plan)).toBe(3);
    expect(plan.farmFromSets).toEqual([{ setHash: SET, count: 2 }]);
    expect(plan.setBonusUnsatisfiable).toBe(false);
  });

  it('degrades gracefully when set bonuses cannot be satisfied', () => {
    // The pinned piece is not part of the set and only 4 pieces can be farmed,
    // so a 5-piece set bonus is impossible — but we still return a plan.
    const ownedByBucket = [[makeOwned('pinned', { [G]: 20 })], [], [], [], []];
    const plan = planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 50 }),
      ownedByBucket,
      requiredSlots: [0],
      setBonusRequirements: [{ setHash: 111, count: 5 }],
      numGeneralMods: 0,
    });
    expect(plan.shortfall).toBe(0);
    expect(plan.setBonusUnsatisfiable).toBe(true);
  });

  it('falls back to the ideal bound when targets are unreachable', () => {
    const ownedByBucket = Array.from({ length: 5 }, (_, i) => [
      makeOwned(`owned-${i}`, { [G]: 10 }),
    ]);
    const plan = planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 200 }),
      ownedByBucket,
      numGeneralMods: 0,
    });
    // Best possible is 5 ideal drops at 30 = 150, so 50 short; keeping owned
    // (weaker) pieces can't help, so the ideal composition is the answer.
    expect(plan.shortfall).toBe(50);
    expect(plan.keep).toHaveLength(0);
    expect(farmTotal(plan)).toBe(5);
  });
});

describe('mod and energy accounting', () => {
  it('prefers a minor mod when it closes the gap', () => {
    // 5 ideal drops give Grenade 150; 155 needs one +5.
    const plan = planBestComposition(BLOCKS, makeRanges({ [G]: 155 }), 5);
    expect(plan.shortfall).toBe(0);
    expect(plan.minorModsPerStat[G]).toBe(1);
    expect(plan.modsPerStat[G]).toBe(0);
  });

  it('uses a major mod for a full 10-point gap', () => {
    const plan = planBestComposition(BLOCKS, makeRanges({ [G]: 160 }), 5);
    expect(plan.shortfall).toBe(0);
    expect(plan.modsPerStat[G]).toBe(1);
    expect(plan.minorModsPerStat[G]).toBe(0);
  });

  it('respects numGeneralMods = 0', () => {
    const plan = planBestComposition(BLOCKS, makeRanges({ [G]: 160 }), 0);
    expect(plan.shortfall).toBe(10);
    expect(modTotal(plan.modsPerStat)).toBe(0);
    expect(modTotal(plan.minorModsPerStat)).toBe(0);
  });

  it('falls back to minor mods when energy cannot fit a major', () => {
    const plan = planBestComposition(BLOCKS, makeRanges({ [G]: 160 }), 5, undefined, 5, {
      autoModCosts: { [G]: { major: 4, minor: 2 } },
      energyBudgets: [3, 3, 3, 3, 3],
    });
    // A +10 costs 4 but no piece has more than 3 energy; two +5s (cost 2) work.
    expect(plan.shortfall).toBe(0);
    expect(plan.modsPerStat[G]).toBe(0);
    expect(plan.minorModsPerStat[G]).toBe(2);
  });

  it('reserves energy for locked general mods', () => {
    // Four locked mods (cost 4) claim the four 4-energy pieces; the one free
    // socket sits on a 2-energy piece where only the +5 (cost 2) fits.
    const plan = planBestComposition(BLOCKS, makeRanges({ [G]: 160 }), 1, undefined, 5, {
      autoModCosts: { [G]: { major: 4, minor: 2 } },
      lockedGeneralModCosts: [4, 4, 4, 4],
      energyBudgets: [4, 4, 4, 4, 2],
    });
    expect(plan.shortfall).toBe(5);
    expect(plan.modsPerStat[G]).toBe(0);
    expect(plan.minorModsPerStat[G]).toBe(1);
  });

  it('accounts for low-energy owned pieces in the acquisition search', () => {
    // Keeping all five owned pieces reaches Grenade 150 of 160; the +10 mod
    // (cost 4) doesn't fit on any 3-energy owned piece, so two +5s close it.
    const ownedByBucket = Array.from({ length: 5 }, (_, i) => [
      makeOwned(`owned-${i}`, { [G]: 30 }, { energy: 3 }),
    ]);
    const plan = planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 160 }),
      ownedByBucket,
      numGeneralMods: 5,
      autoModCosts: { [G]: { major: 4, minor: 2 } },
    });
    expect(plan.shortfall).toBe(0);
    expect(farmTotal(plan)).toBe(0);
    expect(plan.keep).toHaveLength(5);
    expect(plan.minorModsPerStat[G]).toBe(2);
    expect(plan.modsPerStat[G]).toBe(0);
  });
});
