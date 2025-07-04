import { SetTracker } from './set-tracker';
import { ProcessItem } from './types';

const capacity = 5;

const createMockArmor = (id: string, power: number): ProcessItem => ({
  id,
  hash: 123,
  name: `Item ${id}`,
  isExotic: false,
  isArtifice: false,
  remainingEnergyCapacity: 10,
  power,
  stats: {},
  compatibleModSeasons: [],
});

// Helper to generate a stat mix string from an array of 6 numbers (0-10)
function statMixFromArray(arr: number[]): string {
  return arr.map((n) => n.toString(16)).join('');
}

describe('SetTracker', () => {
  it('should handle a basic insertion and retrieval workflow', () => {
    const tracker = new SetTracker(capacity);

    // 1. Initial state
    expect(tracker.totalSets).toBe(0);
    expect(tracker.getArmorSets(5).length).toBe(0);

    // 2. Insert a set (tier 10: [5,5,0,0,0,0])
    const statsA = [5, 5, 0, 0, 0, 0];
    const mixA = statMixFromArray(statsA);
    expect(tracker.couldInsert(10)).toBe(true);
    tracker.insert(10, mixA, [createMockArmor('a', 10)], statsA);
    expect(tracker.totalSets).toBe(1);

    // 3. Insert another set (tier 12: [6,6,0,0,0,0])
    const statsB = [6, 6, 0, 0, 0, 0];
    const mixB = statMixFromArray(statsB);
    tracker.insert(12, mixB, [createMockArmor('b', 10)], statsB);
    expect(tracker.totalSets).toBe(2);

    // 4. Retrieve and verify order (mixB > mixA lexicographically)
    const sets = tracker.getArmorSets(5);
    expect(sets.length).toBe(2);
    expect(sets[0].armor[0].id).toBe('b'); // Higher tier first
    expect(sets[1].armor[0].id).toBe('a');
  });

  it('should handle capacity and trimming correctly', () => {
    const tracker = new SetTracker(capacity);

    // Fill the tracker with realistic stat mixes
    const statsA = [5, 5, 0, 0, 0, 0]; // 10
    const statsB = [6, 6, 0, 0, 0, 0]; // 12
    const statsC = [4, 4, 0, 0, 0, 0]; // 8
    const statsD = [7, 7, 0, 0, 0, 0]; // 14
    const statsE = [6, 0, 0, 0, 0, 0]; // 6

    tracker.insert(10, statMixFromArray(statsA), [createMockArmor('a', 10)], statsA);
    tracker.insert(12, statMixFromArray(statsB), [createMockArmor('b', 10)], statsB);
    tracker.insert(8, statMixFromArray(statsC), [createMockArmor('c', 10)], statsC);
    tracker.insert(14, statMixFromArray(statsD), [createMockArmor('d', 10)], statsD);
    tracker.insert(6, statMixFromArray(statsE), [createMockArmor('e', 10)], statsE);
    expect(tracker.totalSets).toBe(5);

    // Attempt to insert a lower-tier set (should be rejected)
    const statsF = [5, 0, 0, 0, 0, 0]; // 5
    expect(tracker.couldInsert(5)).toBe(false);
    const inserted = tracker.insert(
      5,
      statMixFromArray(statsF),
      [createMockArmor('f', 10)],
      statsF,
    );
    expect(inserted).toBe(false);
    expect(tracker.totalSets).toBe(5);
    let sets = tracker.getArmorSets(5);
    expect(sets.find((s) => s.armor[0].id === 'f')).toBe(undefined);

    // Insert a higher-tier set (tier 7: [7,0,0,0,0,0])
    const statsG = [7, 0, 0, 0, 0, 0];
    expect(tracker.couldInsert(7)).toBe(true);
    const result_success = tracker.insert(
      7,
      statMixFromArray(statsG),
      [createMockArmor('g', 10)],
      statsG,
    );
    expect(result_success).toBe(false);
    expect(tracker.totalSets).toBe(5);
    sets = tracker.getArmorSets(5);
    expect(sets.find((s) => s.armor[0].id === 'e')).toBe(undefined); // 'e' (tier 6) should be gone
    expect(sets.find((s) => s.armor[0].id === 'g')).not.toBe(undefined);
  });

  it('should sort sets correctly based on tier, statmix, and power', () => {
    const tracker = new SetTracker(capacity);

    // All tier 10, but different stat mixes and powers
    const statsB1 = [5, 5, 0, 0, 0, 0]; // 10, mix: 550000
    const statsZ1 = [2, 2, 2, 2, 2, 0]; // 10, mix: 222220
    const statsC1 = [4, 4, 2, 0, 0, 0]; // 10, mix: 442000
    const statsB2 = [4, 6, 0, 0, 0, 0]; // 10, mix: 460000
    const statsA1 = [3, 3, 2, 2, 0, 0]; // 10, mix: 332200

    tracker.insert(10, statMixFromArray(statsB1), [createMockArmor('b1', 10)], statsB1);
    tracker.insert(10, statMixFromArray(statsZ1), [createMockArmor('z1', 10)], statsZ1);
    tracker.insert(10, statMixFromArray(statsC1), [createMockArmor('c1', 10)], statsC1);
    tracker.insert(10, statMixFromArray(statsB2), [createMockArmor('b2', 12)], statsB2);
    tracker.insert(10, statMixFromArray(statsA1), [createMockArmor('a1', 10)], statsA1);

    const sets = tracker.getArmorSets(5);
    expect(sets.length).toBe(5);

    // Expected order:
    // 1. mix: b1 (550000, power 10)
    // 2. mix: b2 (550000, power 10)
    // 3. mix: c1 (442000)
    // 4. mix: a1 (332200)
    // 5. mix: z1 (222220)
    expect(sets.map((s) => s.armor[0].id)).toEqual(['b1', 'b2', 'c1', 'a1', 'z1']);
  });

  it('should handle getting different numbers of sets', () => {
    const tracker = new SetTracker(capacity);

    const statsA = [5, 5, 0, 0, 0, 0]; // 10
    const statsB = [6, 4, 0, 0, 0, 0]; // 10
    const statsC = [10, 0, 0, 0, 0, 0]; // 10

    tracker.insert(10, statMixFromArray(statsA), [createMockArmor('a', 10)], statsA);
    tracker.insert(10, statMixFromArray(statsB), [createMockArmor('b', 10)], statsB);
    tracker.insert(10, statMixFromArray(statsC), [createMockArmor('c', 10)], statsC);

    // Get less than total
    let sets = tracker.getArmorSets(2);
    expect(sets.length).toBe(2);
    expect(sets.map((s) => s.armor[0].id)).toEqual(['c', 'b']);

    // Get more than total
    sets = tracker.getArmorSets(5);
    expect(sets.length).toBe(3);
  });
});
