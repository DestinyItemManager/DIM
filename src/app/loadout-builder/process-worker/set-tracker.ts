import { DesiredStatRange } from '../types';
import { getPower } from '../utils';
import { IntermediateProcessArmorSet, ProcessItem } from './types';

/**
 * Heap entry for the heap-based SetTracker.
 */
interface HeapEntry {
  tier: number;
  statMix: number;
  power: number;
  armor: ProcessItem[];
  stats: number[];
}

/**
 * Comparison: true if a is worse than b (lower priority in min-heap).
 * This creates a min-heap where the root is the worst item.
 * Ordering: tier asc, statMix asc, power asc (opposite of SetTracker for min-heap)
 */
function isWorse(a: HeapEntry, b: HeapEntry): boolean {
  if (a.tier !== b.tier) {
    return a.tier < b.tier;
  }
  if (a.statMix !== b.statMix) {
    return a.statMix < b.statMix;
  }
  return a.power < b.power;
}

/**
 * Min-heap based SetTracker that maintains the top N armor sets.
 * Uses a min-heap where the root is the worst of the top N sets.
 * This allows O(1) access to worst element and O(log n) operations.
 */
export class HeapSetTracker {
  private heap: HeapEntry[] = [];
  readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  /**
   * Can we insert a set with this total tier?
   * Fast O(1) check using the root (worst set) of our min-heap.
   */
  couldInsert(totalTier: number): boolean {
    if (this.heap.length < this.capacity) {
      return true;
    }
    // In min-heap, root is the worst item - check if new item is better
    return totalTier >= this.heap[0].tier;
  }

  /**
   * Insert a set into the heap.
   * Matches SetTracker behavior: allows duplicates, returns true unless trimming.
   */
  insert(tier: number, statMix: number, armor: ProcessItem[], stats: number[]): boolean {
    const power = getPower(armor);
    const entry: HeapEntry = { tier, statMix, power, armor, stats };

    if (this.heap.length < this.capacity) {
      this.heap.push(entry);
      this.bubbleUp(this.heap.length - 1);
      return true;
    }

    // Check with full comparison
    if (isWorse(entry, this.heap[0])) {
      return false; // Not good enough after full comparison
    }

    // Replace the worst set (root) with the new one
    this.heap[0] = entry;
    this.bubbleDown(0);

    return false; // Match original SetTracker behavior (trimWorstSet returns false)
  }

  /**
   * Get the top N armor sets in order (best first).
   * Since we have a min-heap, we sort a copy and take the best items.
   */
  getArmorSets(): IntermediateProcessArmorSet[] {
    // Copy heap and sort in SetTracker order (best first)
    return this.heap.toSorted((a, b) => {
      // Sort by tier desc, statMix desc, power desc (opposite of min-heap order)
      if (a.tier !== b.tier) {
        return b.tier - a.tier;
      }
      if (a.statMix !== b.statMix) {
        return b.statMix - a.statMix;
      }
      return b.power - a.power;
    });
  }

  get totalSets(): number {
    return this.heap.length;
  }

  // Heap maintenance methods

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (isWorse(this.heap[index], this.heap[parentIndex])) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && isWorse(this.heap[leftChild], this.heap[smallest])) {
        smallest = leftChild;
      }

      if (rightChild < length && isWorse(this.heap[rightChild], this.heap[smallest])) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Encodes stat values into a 48-bit integer for fast comparison.
 * Each stat uses 8 bits (sufficient for 0-200 range), packed in priority order.
 * Only non-ignored stats (with maxStat > 0) are included in the encoding.
 *
 * @param stats Array of stat values in stat priority order
 * @param desiredStatRanges Stat ranges to determine which stats are ignored
 * @returns 48-bit integer representation that maintains lexical ordering
 */
export function encodeStatMix(
  stats: readonly number[],
  desiredStatRanges: readonly DesiredStatRange[],
): number {
  let encoded = 0;
  for (let i = 0; i < 6; i++) {
    const filter = desiredStatRanges[i];
    if (filter.maxStat > 0) {
      // non-ignored stat
      // Use multiplication instead of bit shifting to avoid 32-bit overflow
      encoded = encoded * 256 + Math.min(stats[i], 255);
    }
  }
  return encoded;
}

/**
 * Decodes a stat mix integer back to individual stat values.
 * Useful for debugging or display purposes.
 *
 * @param encoded The encoded stat mix integer
 * @param numStats Number of stats that were encoded
 * @returns Array of decoded stat values
 */
export function decodeStatMix(encoded: number, numStats: number): number[] {
  const stats: number[] = [];
  let remaining = encoded;
  for (let i = 0; i < numStats; i++) {
    // Extract the rightmost 8 bits using modulo, then divide for next stat
    stats.unshift(remaining % 256);
    remaining = Math.floor(remaining / 256);
  }
  return stats;
}
