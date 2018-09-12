export type Comparator<T> = (a: T, b: T) => number;

/**
 * Generate a comparator from a mapping function.
 *
 * @example
 * // Returns a comparator that compares items by primary stat
 * compareBy((item) => item.primStat.value)
 */
export function compareBy<T, V>(fn: (arg: T) => V): Comparator<T> {
  return (a, b) => {
    const aVal = fn(a);
    const bVal = fn(b);
    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
  };
}

/**
 * Reverse the order of a comparator.
 */
export function reverseComparator<T>(compare: Comparator<T>): Comparator<T> {
  return (a, b) => -1 * compare(a, b);
}

/**
 * Chain multiple comparators together. If two values are equal according to one comparator, we try the next and so on.
 */
export function chainComparator<T>(...compares: Comparator<T>[]): Comparator<T> {
  return (a, b) => {
    for (const compare of compares) {
      const retval = compare(a, b);
      if (retval !== 0) {
        return retval;
      }
    }
    return 0;
  };
}
