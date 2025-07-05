import { getPower } from '../utils';
import { IntermediateProcessArmorSet, ProcessItem } from './types';

/**
 * Heap entry for the heap-based SetTracker.
 */
interface HeapEntry {
  tier: number;
  statMix: string;
  power: number;
  armor: ProcessItem[];
  stats: number[];
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
   * Comparison: true if a is worse than b (lower priority in min-heap).
   * This creates a min-heap where the root is the worst item.
   * Ordering: tier asc, statMix asc, power asc (opposite of SetTracker for min-heap)
   */
  private static isWorse(a: HeapEntry, b: HeapEntry): boolean {
    if (a.tier !== b.tier) {
      return a.tier < b.tier;
    }
    if (a.statMix !== b.statMix) {
      return a.statMix < b.statMix;
    }
    return a.power < b.power;
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
  insert(tier: number, statMix: string, armor: ProcessItem[], stats: number[]): boolean {
    if (this.heap.length < this.capacity) {
      // Not at capacity - create entry and add it
      const power = getPower(armor);
      const entry: HeapEntry = { tier, statMix, power, armor, stats };
      this.heap.push(entry);
      this.bubbleUp(this.heap.length - 1);
      return true;
    }

    // At capacity - do quick tier check first to avoid wasteful object creation
    if (!this.couldInsert(tier)) {
      return false; // Quick rejection, no HeapEntry created
    }

    // Tier looks promising - create full entry for detailed comparison
    const power = getPower(armor);
    const entry: HeapEntry = { tier, statMix, power, armor, stats };

    // Final check with full comparison
    if (!HeapSetTracker.isWorse(this.heap[0], entry)) {
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
  getArmorSets(max: number): IntermediateProcessArmorSet[] {
    if (max <= 0) {
      return [];
    }

    if (this.heap.length === 0) {
      return [];
    }

    // Copy heap and sort in SetTracker order (best first)
    const sorted = [...this.heap];
    sorted.sort((a, b) => {
      // Sort by tier desc, statMix desc, power desc (opposite of min-heap order)
      if (a.tier !== b.tier) {
        return b.tier - a.tier;
      }
      if (a.statMix !== b.statMix) {
        return b.statMix.localeCompare(a.statMix);
      }
      return b.power - a.power;
    });

    // Take the first N items (best items after sorting)
    const result: IntermediateProcessArmorSet[] = [];
    const count = Math.min(max, sorted.length);

    for (let i = 0; i < count; i++) {
      result.push({ armor: sorted[i].armor, stats: sorted[i].stats });
    }

    return result;
  }

  get totalSets(): number {
    return this.heap.length;
  }

  // Heap maintenance methods

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (HeapSetTracker.isWorse(this.heap[index], this.heap[parentIndex])) {
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

      if (leftChild < length && HeapSetTracker.isWorse(this.heap[leftChild], this.heap[smallest])) {
        smallest = leftChild;
      }

      if (
        rightChild < length &&
        HeapSetTracker.isWorse(this.heap[rightChild], this.heap[smallest])
      ) {
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
