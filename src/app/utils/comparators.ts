export type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;

/**
 * Generate a comparator from a mapping function.
 *
 * @example
 * // Returns a comparator that compares items by power
 * compareBy((item) => item.power)
 */
export function compareBy<T>(fn: (arg: T) => number | string | undefined | boolean): Comparator<T> {
  return (a, b) => {
    const aVal = fn(a);
    const bVal = fn(b);
    // Undefined is neither greater than or less than anything.
    // This considers it less than everything (except another undefined).

    return aVal === bVal
      ? 0 // neither goes first
      : bVal === undefined
        ? 1 // b goes first
        : aVal === undefined || aVal < bVal
          ? -1 // a goes first
          : aVal > bVal
            ? 1 // b goes first
            : 0; // a fallback that would catch only invalid inputs
  };
}

/**
 * Reverse the order of a comparator.
 */
export function reverseComparator<T>(compare: Comparator<T>): Comparator<T> {
  return (a, b) => compare(b, a);
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

export function compareByIndex<T, V>(list: V[], fn: (arg: T) => V): Comparator<T> {
  return compareBy((arg) => {
    const ix = list.indexOf(fn(arg));
    return ix === -1 ? Number.MAX_SAFE_INTEGER : ix;
  });
}
