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
 * Result helper for distinguishing between different cases in the better stats helper
 */
const enum BetterStatsResult {
  // There exists a known set of stats with at least one higher stat than the input, and NO lower stats
  BETTER_STATS_EXIST = -1,
  // There exists a known set of stats with exactly the same stats as the input, but nothing better
  SAME = 0,
  // The input has at least one stat higher than any known set of stats
  HIGHER_STAT = 1,
}

/**
 * A StatsSet can be populated with a bunch of stats, and can then answer questions such as:
 * 1. Have we seen stats that are strictly better than the input stats?
 * 2. Get all the items with lower stats than the input stats.
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
    for (let statIndex = 0; statIndex < stats.length; statIndex++) {
      const stat = stats[statIndex];
      const [insertionIndex, found] = findNode(currentNodes, stat);
      if (!found) {
        currentNodes.splice(insertionIndex, 0, {
          value: stat,
          next: [],
        });
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
   * ```
   * {
   *   [1, 2, 3],
   *   [1, 1, 2],
   *   [1, 1, 1]
   * }
   * ```
   *
   * Then:
   *
   *   * `doBetterStatsExist([1, 2, 3]) === false`
   *   * `doBetterStatsExist([1, 2, 2]) === true`
   *   * `doBetterStatsExist([2, 1, 1]) === false`
   *
   * See tests for more examples.
   */
  doBetterStatsExist(stats: number[]) {
    // See if the input stats are lower than some other known set
    return betterStatsHelper(this.statNodes, stats, 0) === BetterStatsResult.BETTER_STATS_EXIST;
  }
}

/**
 * Return whether the input stats are higher, lower, or the same than stats we know about, in a recursive fashion.
 */
function betterStatsHelper<T>(
  nodes: StatNode<T>[],
  stats: number[],
  statIndex: number,
): BetterStatsResult {
  const stat = stats[statIndex];
  // Iterate all nodes in descending value until the value is lower than our stat
  for (const node of nodes) {
    if (node.value < stat) {
      // If we get here and haven't returned, then the input has at least one stat better than any known set in this subtree
      return BetterStatsResult.HIGHER_STAT;
    }
    // At this point node.value is definitely >= stat

    // If this is the leaf nodes, just return based on the node value vs. our stat
    if (node.items) {
      return node.value > stat
        ? BetterStatsResult.BETTER_STATS_EXIST
        : node.value === stat
          ? BetterStatsResult.SAME
          : BetterStatsResult.HIGHER_STAT;
    }

    // Evaluate the subtree from this node
    const subResult = betterStatsHelper(node.next, stats, statIndex + 1);

    switch (subResult) {
      case BetterStatsResult.BETTER_STATS_EXIST:
        // If better stats exist in the subtree, and this node is better or the same as our input,
        // then this subtree contains a better stat set.
        return BetterStatsResult.BETTER_STATS_EXIST;

      case BetterStatsResult.SAME:
        // If our stats are exactly the same in the subtree, then it comes down
        // to whether our stat is higher than this node's value or if it's
        // equal.
        return node.value === stat ? BetterStatsResult.SAME : BetterStatsResult.BETTER_STATS_EXIST;

      case BetterStatsResult.HIGHER_STAT: // - Keep looking, this subtree didn't pan out because our input stat was higher than some of them
    }
  }
  // This can happen if nodes is empty - in which case we consider the input higher than any known stat since none are known
  return BetterStatsResult.HIGHER_STAT;
}

/**
 * Find a given node in a list by its value. Returns the index it was found and whether it was found.
 * If it wasn't found, the index is where it should be inserted.
 */
function findNode<T>(nodes: StatNode<T>[], val: number): [index: number, found: boolean] {
  // TODO: I guess re-inline this? It didn't end up being as reusable as I was hoping.
  // TODO: binary search (later). Right now it's just insertion sort
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
