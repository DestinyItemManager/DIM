/**
 * The internal structure of StatsSet is a trie (https://en.wikipedia.org/wiki/Trie) where
 * each level represents a consecutive stat in a stat array.
 */
interface StatNode<T> {
  /** The value of the stat */
  value: number;
  /** The next set of stats. This array is ordered by the stat nodes' value, in decreasing order. */
  next: StatNode<T>[];
  /** The terminal node holds the actual inserted items */
  items?: T[];
}

/**
 * A StatsSet can be populated with a bunch of stats, and can then answer questions such as:
 * 1. Have we seen stats that are strictly better than the input stats?
 * 2. ???
 *
 * In general "stats" are just an ordered array of numbers, and can represent anything - item stats, set tiers, etc.
 */
export class StatsSet<T> {
  statNodes: StatNode<T>[] = [];

  /**
   * Insert a new line of stats and an associated value into the set. Input
   * stats must always be in the same order and have the same length.
   */
  insert(stats: number[], item: T) {
    let currentNodes = this.statNodes;
    // TODO: binary search (later). Right now it's just insertion sort
    // TODO: find (returns index + found)
    for (let statIndex = 0; statIndex < stats.length; statIndex++) {
      const stat = stats[statIndex];
      let insertionIndex = 0;
      if (currentNodes.length === 0) {
        currentNodes.push({
          value: stat,
          next: [],
        });
        insertionIndex = 0;
      } else {
        for (let nodeIndex = 0; nodeIndex < currentNodes.length; nodeIndex++) {
          const node = currentNodes[nodeIndex];
          if (stat > node.value) {
            currentNodes.splice(nodeIndex, 0, {
              value: stat,
              next: [],
            });
            insertionIndex = nodeIndex;
            break;
          } else if (stat === node.value) {
            insertionIndex = nodeIndex;
            break;
          } else if (nodeIndex === currentNodes.length - 1) {
            currentNodes.push({
              value: stat,
              next: [],
            });
            insertionIndex = nodeIndex + 1;
            break;
          }
        }
      }

      if (statIndex === stats.length - 1) {
        (currentNodes[insertionIndex].items ||= []).push(item);
      }

      currentNodes = currentNodes[insertionIndex].next;
    }
  }

  /**
   * Given all the stats this set knows about, are there any stats which are better than
   * this one? For this to be true at least one stat array that was inserted must have each
   * stat be better or equal to the input, without being equal to the input stats. For example,
   * if the stat set contains:
   *
   * {
   *   [1, 2, 3],
   *   [1, 1, 2],
   *   [1, 1, 1]
   * }
   *
   * Then:
   *
   * doBetterStatsExist([1, 2, 3]) === false
   * doBetterStatsExist([1, 2, 2]) === true
   * doBetterStatsExist([2, 1, 1]) === false
   *
   * See tests for more examples.
   */
  doBetterStatsExist(stats: number[]) {}

  /**
   * Get all saved stats sets which are lower than the input example. This won't return
   * something with the exact same stats as the input, but if any stat is lower than the
   * input and all other stats are lower or equal, it will be returned.
   */
  // TODO: should be removeByLowerStats? Combine with an insert?
  getByLowerStats(stats: number[]) {}
}

function findNode<T>(nodes: StatNode<T>[], val: number): [index: number, found: boolean] {
  if (nodes.length === 0) {
    return [0, false];
  } else {
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const node = nodes[nodeIndex];
      if (val > node.value) {
        return [nodeIndex, false];
      } else if (val === node.value) {
        return [nodeIndex, true];
      }
    }
    return [nodes.length, false];
  }
}
