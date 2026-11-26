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
import { planForTargets, PlannerInputs, PlannerPiece, totalFarmCount } from './planner';

/**
 * Synthetic-fixture tests for the acquisition planner — no manifest needed.
 * These cover the bug-prone areas: pins, set-bonus deficits, the ideal-bound
 * fallback, and mod/energy accounting.
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

function makeRanges(
  targets: Partial<Record<ArmorStatHashes, number>>,
  ignored: ArmorStatHashes[] = [],
): DesiredStatRange[] {
  return armorStats.map((statHash) => ({
    statHash,
    minStat: targets[statHash] ?? 0,
    maxStat: ignored.includes(statHash) ? 0 : 200,
  }));
}

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
    expect(totalFarmCount(plan.farm)).toBe(0);
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
    expect(totalFarmCount(plan.farm)).toBe(3);
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
    expect(totalFarmCount(plan.farm)).toBe(4);
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
    expect(totalFarmCount(plan.farm)).toBe(3);
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
    expect(totalFarmCount(plan.farm)).toBe(5);
  });
});

describe('farmed-piece tuning', () => {
  // 5 farmed blocks reach Grenade 150; the target is 5 higher than that.
  const plan = (ignored: ArmorStatHashes[]) =>
    planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 155 }, ignored),
      // Five empty slots: nothing owned, so all five are farmed.
      ownedByBucket: [[], [], [], [], []],
      numGeneralMods: 0,
    });

  it('spends a farmed tuning slot to close the last few points', () => {
    const result = plan([H]);
    expect(result.shortfall).toBe(0);
    expect(result.tunesPerStat[G]).toBe(1);
  });

  it('grants no tuning when there is no stat to dump into', () => {
    // Every stat is wanted, so the -5 would cost as much as the +5 buys.
    const result = plan([]);
    expect(result.shortfall).toBe(5);
    expect(modTotal(result.tunesPerStat)).toBe(0);
  });

  it('gives kept pieces no farmed tuning — only the farmed ones', () => {
    // Four owned pieces at Grenade 30 plus one farmed block also reach 150,
    // so only that single farmed piece brings a tuning slot: +5, not +25.
    const result = planMinimumAcquisitions({
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 155 }, [H]),
      ownedByBucket: [
        ...Array.from({ length: 4 }, (_, i) => [makeOwned(`owned-${i}`, { [G]: 30 })]),
        [],
      ],
      numGeneralMods: 0,
    });
    expect(result.shortfall).toBe(0);
    expect(modTotal(result.tunesPerStat)).toBe(1);
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
    expect(totalFarmCount(plan.farm)).toBe(0);
    expect(plan.keep).toHaveLength(5);
    expect(plan.minorModsPerStat[G]).toBe(2);
    expect(plan.modsPerStat[G]).toBe(0);
  });
});

describe('planForTargets (worker orchestration)', () => {
  function makePiece(
    id: string,
    statValues: Partial<Record<ArmorStatHashes, number>>,
    isExotic = false,
    itemId = id,
  ): PlannerPiece {
    return { ...makeOwned(id, statValues), id, itemId, isExotic };
  }

  it('pins by item, so every tuning variant of the pinned item stays eligible', () => {
    // Same item, two tuning options. Only the second gets the set to 150.
    const untuned = makePiece('helm|untuned', { [G]: 25 }, false, 'helm');
    const tuned = makePiece('helm|tuned', { [G]: 30 }, false, 'helm');
    const result = planForTargets(
      makeInputs({
        piecesByBucket: [[untuned, tuned], [], [], [], []],
        pinnedIds: ['helm', undefined, undefined, undefined, undefined],
        desiredStatRanges: makeRanges({ [G]: 150 }),
      }),
    );
    expect(result.shortfall).toBe(0);
    expect(result.keepIds).toContain('helm|tuned');
  });

  function makeInputs(overrides: Partial<PlannerInputs>): PlannerInputs {
    return {
      blocks: BLOCKS,
      desiredStatRanges: makeRanges({ [G]: 150 }),
      modStatTotals: zeroArmorStats(),
      piecesByBucket: [[], [], [], [], []],
      pinnedIds: [undefined, undefined, undefined, undefined, undefined],
      exoticMode: { type: 'none' },
      keepOwned: true,
      setBonusRequirements: [],
      numGeneralMods: 0,
      lockedGeneralModCosts: [],
      bucketSpecificCosts: [0, 0, 0, 0, 0],
      ...overrides,
    };
  }

  it('flags a locked exotic the user does not own and farms its slot', () => {
    const result = planForTargets(makeInputs({ exoticMode: { type: 'locked', bucketIndex: 0 } }));
    expect(result.exoticMissing).toBe(true);
    expect(result.exoticId).toBeUndefined();
    expect(result.shortfall).toBe(0);
    expect(totalFarmCount(result.farm)).toBe(5);
  });

  it('builds around the best owned copy of a locked exotic', () => {
    const exotic = makePiece('geomag', { [G]: 30, [S]: 25 }, true);
    const worse = makePiece('geomag-weak', { [G]: 30 }, true);
    const result = planForTargets(
      makeInputs({
        piecesByBucket: [[], [], [worse, exotic], [], []],
        desiredStatRanges: makeRanges({ [G]: 150, [S]: 25 }),
        exoticMode: { type: 'locked', bucketIndex: 2 },
      }),
    );
    expect(result.exoticMissing).toBe(false);
    expect(result.exoticId).toBe('geomag');
    expect(result.shortfall).toBe(0);
    // The exotic covers its slot; the other four are farmed.
    expect(totalFarmCount(result.farm)).toBe(4);
    expect(result.keepIds).not.toContain('geomag');
    // An equally good plan that costs an extra drop is not an improvement.
    expect(result.farmExotic).toBe(false);
  });

  it('farms a fresh copy of a locked exotic when the owned one falls short', () => {
    const weakExotic = makePiece('geomag-weak', { [G]: 5 }, true);
    const result = planForTargets(
      makeInputs({
        piecesByBucket: [[], [], [weakExotic], [], []],
        desiredStatRanges: makeRanges({ [G]: 150 }),
        exoticMode: { type: 'locked', bucketIndex: 2 },
      }),
    );
    // Owned: 5 + 4×30 = 125. Farmed: 5×30 = 150.
    expect(result.farmExotic).toBe(true);
    expect(result.exoticId).toBeUndefined();
    expect(result.exoticMissing).toBe(false);
    expect(result.shortfall).toBe(0);
    expect(totalFarmCount(result.farm)).toBe(5);
  });

  it('Any Exotic: tries each slot and picks the exotic that minimizes the gap', () => {
    const weak = makePiece('weak-exotic', { [W]: 30 }, true);
    const strong = makePiece('strong-exotic', { [G]: 30 }, true);
    const result = planForTargets(
      makeInputs({
        piecesByBucket: [[weak], [strong], [], [], []],
        desiredStatRanges: makeRanges({ [G]: 150 }),
        exoticMode: { type: 'any' },
      }),
    );
    // Only the Grenade exotic reaches 30 + 4×30 = 150.
    expect(result.exoticId).toBe('strong-exotic');
    expect(result.shortfall).toBe(0);
    expect(result.anyExoticMissing).toBe(false);
    expect(result.farmExotic).toBe(false);
  });

  it('Any Exotic: farms a new exotic when no owned copy is good enough', () => {
    const wrongStat = makePiece('weapons-exotic', { [W]: 30 }, true);
    const result = planForTargets(
      makeInputs({
        piecesByBucket: [[wrongStat], [], [], [], []],
        desiredStatRanges: makeRanges({ [G]: 150 }),
        exoticMode: { type: 'any' },
      }),
    );
    // Keeping it: 0 + 4×30 = 120. Farming one: 5×30 = 150.
    expect(result.farmExotic).toBe(true);
    expect(result.exoticId).toBeUndefined();
    // They do own an exotic — it just isn't worth using.
    expect(result.anyExoticMissing).toBe(false);
    expect(result.shortfall).toBe(0);
  });

  it('Any Exotic with no owned exotics degrades to ideal drops plus a note', () => {
    const result = planForTargets(makeInputs({ exoticMode: { type: 'any' } }));
    expect(result.anyExoticMissing).toBe(true);
    expect(result.exoticId).toBeUndefined();
    expect(result.shortfall).toBe(0);
    expect(totalFarmCount(result.farm)).toBe(5);
  });

  it('Any Exotic respects a pinned exotic as the chosen one', () => {
    const pinnedExotic = makePiece('pinned-exotic', { [W]: 30 }, true);
    const betterExotic = makePiece('better-exotic', { [G]: 30 }, true);
    const result = planForTargets(
      makeInputs({
        piecesByBucket: [[pinnedExotic], [betterExotic], [], [], []],
        pinnedIds: ['pinned-exotic', undefined, undefined, undefined, undefined],
        desiredStatRanges: makeRanges({ [G]: 120 }),
        exoticMode: { type: 'any' },
      }),
    );
    expect(result.exoticId).toBe('pinned-exotic');
  });
});
