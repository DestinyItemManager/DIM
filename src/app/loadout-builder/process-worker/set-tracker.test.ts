import { HeapSetTracker } from './heap-set-tracker';
import { SetTracker } from './set-tracker';
import { ProcessItem } from './types';

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

/**
 * Essential functional tests for both SetTracker and HeapSetTracker.
 * Covers core behaviors needed by process.ts.
 */
const trackerImplementations = [
  { name: 'SetTracker', ctor: SetTracker },
  { name: 'HeapSetTracker', ctor: HeapSetTracker },
];

for (const { name, ctor } of trackerImplementations) {
  describe(name, () => {
    it('should handle basic insertion, ordering, and retrieval', () => {
      const tracker = new ctor(5);

      // Insert sets with different tiers and stat mixes
      expect(tracker.insert(10, '550000', [createMockArmor('a', 1000)], [5, 5, 0, 0, 0, 0])).toBe(
        true,
      );
      expect(tracker.insert(12, '660000', [createMockArmor('b', 1200)], [6, 6, 0, 0, 0, 0])).toBe(
        true,
      );
      expect(tracker.insert(10, '460000', [createMockArmor('c', 1100)], [4, 6, 0, 0, 0, 0])).toBe(
        true,
      );

      expect(tracker.totalSets).toBe(3);

      // Verify ordering: tier desc, then statMix desc, then power desc
      const sets = tracker.getArmorSets(10);
      expect(sets[0].armor[0].id).toBe('b'); // tier 12
      expect(sets[1].armor[0].id).toBe('a'); // tier 10, mix 550000
      expect(sets[2].armor[0].id).toBe('c'); // tier 10, mix 460000
    });

    it('should handle capacity limits and trimming correctly', () => {
      const tracker = new ctor(3);

      // Fill to capacity
      expect(tracker.insert(10, '550000', [createMockArmor('a', 1000)], [5, 5, 0, 0, 0, 0])).toBe(
        true,
      );
      expect(tracker.insert(12, '660000', [createMockArmor('b', 1000)], [6, 6, 0, 0, 0, 0])).toBe(
        true,
      );
      expect(tracker.insert(8, '440000', [createMockArmor('c', 1000)], [4, 4, 0, 0, 0, 0])).toBe(
        true,
      );
      expect(tracker.totalSets).toBe(3);

      // Insert low tier - should be rejected
      const lowResult = tracker.insert(
        6,
        '330000',
        [createMockArmor('d', 1000)],
        [3, 3, 0, 0, 0, 0],
      );
      expect(lowResult).toBe(false);
      expect(tracker.totalSets).toBe(3);

      // Insert high tier - should succeed but cause trimming
      const highResult = tracker.insert(
        14,
        '770000',
        [createMockArmor('e', 1000)],
        [7, 7, 0, 0, 0, 0],
      );
      expect(highResult).toBe(false); // trimWorstSet returns false
      expect(tracker.totalSets).toBe(3);

      // Verify worst item was removed
      const sets = tracker.getArmorSets(5);
      expect(sets.find((s) => s.armor[0].id === 'c')).toBe(undefined); // tier 8 removed
      expect(sets.find((s) => s.armor[0].id === 'e')).not.toBe(undefined); // tier 14 kept
    });

    it('should implement couldInsert correctly for hot path optimization', () => {
      const tracker = new ctor(2);

      // Empty tracker accepts everything
      expect(tracker.couldInsert(5)).toBe(true);
      expect(tracker.couldInsert(50)).toBe(true);

      // Fill to capacity
      expect(tracker.insert(10, '550000', [createMockArmor('a', 1000)], [5, 5, 0, 0, 0, 0])).toBe(
        true,
      );
      expect(tracker.insert(8, '440000', [createMockArmor('b', 1000)], [4, 4, 0, 0, 0, 0])).toBe(
        true,
      );

      // At capacity: reject < worst, accept >= worst
      expect(tracker.couldInsert(7)).toBe(false); // < 8
      expect(tracker.couldInsert(8)).toBe(true); // >= 8 (matches SetTracker behavior)
      expect(tracker.couldInsert(15)).toBe(true); // > 8
    });

    it('should handle duplicate detection', () => {
      const tracker = new ctor(5);

      // Insert first item
      tracker.insert(10, '550000', [createMockArmor('a', 1000)], [5, 5, 0, 0, 0, 0]);

      // SetTracker contract allows duplicates
      const result = tracker.insert(10, '550000', [createMockArmor('b', 900)], [5, 5, 0, 0, 0, 0]);
      expect(result).toBe(true);
      expect(tracker.totalSets).toBe(2);
    });
  });
}
