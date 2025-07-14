import { armorStats } from 'app/search/d2-known-values';
import { decodeStatMix, encodeStatMix, HeapSetTracker } from './set-tracker';
import { ProcessItem } from './types';

const createMockArmor = (id: string, power: number): ProcessItem => ({
  id,
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
const trackerImplementations = [{ name: 'HeapSetTracker', ctor: HeapSetTracker }];

for (const { name, ctor } of trackerImplementations) {
  describe(name, () => {
    const desiredStatRanges = armorStats.map((statHash) => ({
      statHash,
      maxStat: 100,
      minStat: 10,
    }));

    it('should handle basic insertion, ordering, and retrieval', () => {
      const tracker = new ctor(5);

      // Insert sets with different tiers and stat mixes
      expect(
        tracker.insert(
          10,
          encodeStatMix([5, 5, 0, 0, 0, 0], desiredStatRanges),
          [createMockArmor('a', 1000)],
          [5, 5, 0, 0, 0, 0],
        ),
      ).toBe(true);
      expect(
        tracker.insert(
          12,
          encodeStatMix([6, 6, 0, 0, 0, 0], desiredStatRanges),
          [createMockArmor('b', 1200)],
          [6, 6, 0, 0, 0, 0],
        ),
      ).toBe(true);
      expect(
        tracker.insert(
          10,
          encodeStatMix([4, 6, 0, 0, 0, 0], desiredStatRanges),
          [createMockArmor('c', 1100)],
          [4, 6, 0, 0, 0, 0],
        ),
      ).toBe(true);

      expect(tracker.totalSets).toBe(3);

      // Verify ordering: tier desc, then statMix desc, then power desc
      const sets = tracker.getArmorSets();
      expect(sets[0].armor[0].id).toBe('b'); // tier 12
      expect(sets[1].armor[0].id).toBe('a'); // tier 10, mix 550000
      expect(sets[2].armor[0].id).toBe('c'); // tier 10, mix 460000
    });

    it('should handle capacity limits and trimming correctly', () => {
      const tracker = new ctor(3);

      // Fill to capacity
      expect(
        tracker.insert(
          10,
          encodeStatMix([5, 5, 0, 0, 0, 0], desiredStatRanges),
          [createMockArmor('a', 1000)],
          [5, 5, 0, 0, 0, 0],
        ),
      ).toBe(true);
      expect(
        tracker.insert(
          12,
          encodeStatMix([6, 6, 0, 0, 0, 0], desiredStatRanges),
          [createMockArmor('b', 1000)],
          [6, 6, 0, 0, 0, 0],
        ),
      ).toBe(true);
      expect(
        tracker.insert(
          8,
          encodeStatMix([4, 4, 0, 0, 0, 0], desiredStatRanges),
          [createMockArmor('c', 1000)],
          [4, 4, 0, 0, 0, 0],
        ),
      ).toBe(true);
      expect(tracker.totalSets).toBe(3);

      // Insert low tier - should be rejected
      const lowResult = tracker.insert(
        6,
        encodeStatMix([3, 3, 0, 0, 0, 0], desiredStatRanges),
        [createMockArmor('d', 1000)],
        [3, 3, 0, 0, 0, 0],
      );
      expect(lowResult).toBe(false);
      expect(tracker.totalSets).toBe(3);

      // Insert high tier - should succeed but cause trimming
      const highResult = tracker.insert(
        14,
        encodeStatMix([7, 7, 0, 0, 0, 0], desiredStatRanges),
        [createMockArmor('e', 1000)],
        [7, 7, 0, 0, 0, 0],
      );
      expect(highResult).toBe(false); // trimWorstSet returns false
      expect(tracker.totalSets).toBe(3);

      // Verify worst item was removed
      const sets = tracker.getArmorSets();
      expect(sets.find((s) => s.armor[0].id === 'c')).toBe(undefined); // tier 8 removed
      expect(sets.find((s) => s.armor[0].id === 'e')).not.toBe(undefined); // tier 14 kept
    });

    it('should implement couldInsert correctly for hot path optimization', () => {
      const tracker = new ctor(2);

      // Empty tracker accepts everything
      expect(tracker.couldInsert(5)).toBe(true);
      expect(tracker.couldInsert(50)).toBe(true);

      // Fill to capacity
      expect(
        tracker.insert(
          10,
          encodeStatMix([5, 5, 0, 0, 0, 0], desiredStatRanges),
          [createMockArmor('a', 1000)],
          [5, 5, 0, 0, 0, 0],
        ),
      ).toBe(true);
      expect(
        tracker.insert(
          8,
          encodeStatMix([4, 4, 0, 0, 0, 0], desiredStatRanges),
          [createMockArmor('b', 1000)],
          [4, 4, 0, 0, 0, 0],
        ),
      ).toBe(true);

      // At capacity: reject < worst, accept >= worst
      expect(tracker.couldInsert(7)).toBe(false); // < 8
      expect(tracker.couldInsert(8)).toBe(true); // >= 8 (matches SetTracker behavior)
      expect(tracker.couldInsert(15)).toBe(true); // > 8
    });

    it('should handle duplicate detection', () => {
      const tracker = new ctor(5);

      // Insert first item
      tracker.insert(
        10,
        encodeStatMix([5, 5, 0, 0, 0, 0], desiredStatRanges),
        [createMockArmor('a', 1000)],
        [5, 5, 0, 0, 0, 0],
      );

      // SetTracker contract allows duplicates
      const result = tracker.insert(
        10,
        encodeStatMix([5, 5, 0, 0, 0, 0], desiredStatRanges),
        [createMockArmor('b', 900)],
        [5, 5, 0, 0, 0, 0],
      );
      expect(result).toBe(true);
      expect(tracker.totalSets).toBe(2);
    });
  });
}

describe('stat mix encoding/decoding', () => {
  const desiredStatRanges = armorStats.map((statHash) => ({
    statHash,
    maxStat: 100,
    minStat: 10,
  }));

  const desiredStatRangesWithIgnored = armorStats.map((statHash, i) => ({
    statHash,
    maxStat: i === 1 || i === 3 ? 0 : 100, // resilience and discipline ignored
    minStat: i === 1 || i === 3 ? 0 : 10,
  }));

  describe('encodeStatMix', () => {
    it('should only encode non-ignored stats', () => {
      const stats = [50, 999, 100, 999, 25, 150]; // ignored stats have high values
      const encoded = encodeStatMix(stats, desiredStatRangesWithIgnored);

      // Only mobility(50), recovery(100), intellect(25), strength(150) should be encoded
      // The 999 values should be skipped entirely
      const decoded = decodeStatMix(encoded, 4); // 4 non-ignored stats
      expect(decoded).toEqual([50, 100, 25, 150]);
    });

    it('should handle zero values correctly', () => {
      const stats = [0, 0, 0, 0, 0, 0];
      const encoded = encodeStatMix(stats, desiredStatRanges);
      expect(encoded).toBe(0);

      const decoded = decodeStatMix(encoded, 6);
      expect(decoded).toEqual([0, 0, 0, 0, 0, 0]);
    });

    it('should maintain lexical ordering for comparison', () => {
      const stats1 = [100, 50, 75, 25, 150, 200];
      const stats2 = [100, 50, 75, 25, 150, 199]; // last stat one less
      const stats3 = [100, 50, 75, 25, 149, 200]; // second-to-last stat one less

      const encoded1 = encodeStatMix(stats1, desiredStatRanges);
      const encoded2 = encodeStatMix(stats2, desiredStatRanges);
      const encoded3 = encodeStatMix(stats3, desiredStatRanges);

      // Higher stats should produce higher encoded values (for same priority positions)
      expect(encoded1).toBeGreaterThan(encoded2);
      expect(encoded1).toBeGreaterThan(encoded3);
      // Earlier stat positions should have higher priority - stats2 has higher value in position 4 (more significant)
      // so stats2 should be greater than stats3 even though stats3 has higher value in position 5 (less significant)
      expect(encoded2).toBeGreaterThan(encoded3);
    });
  });

  describe('decodeStatMix', () => {
    it('should correctly decode encoded values', () => {
      const originalStats = [50, 75, 100, 25, 150, 200];
      const encoded = encodeStatMix(originalStats, desiredStatRanges);
      const decoded = decodeStatMix(encoded, 6);

      expect(decoded).toEqual(originalStats);
    });

    it('should handle partial decoding for ignored stats', () => {
      const stats = [50, 999, 100, 999, 25, 150];
      const encoded = encodeStatMix(stats, desiredStatRangesWithIgnored);
      const decoded = decodeStatMix(encoded, 4);

      // Should decode only the 4 non-ignored stats
      expect(decoded).toEqual([50, 100, 25, 150]);
    });

    it('should handle edge case of empty encoding', () => {
      const decoded = decodeStatMix(0, 0);
      expect(decoded).toEqual([]);
    });
  });
});
