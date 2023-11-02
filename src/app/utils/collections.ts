/**
 * Count the number of values in the list that pass the predicate.
 */
export function count<T>(
  list: readonly T[],
  predicate: (value: T) => boolean | null | undefined,
): number {
  return list.reduce((total, item) => (predicate(item) ? total + 1 : total), 0);
}

/**
 * A single-pass filter and map function. Returning `undefined` from the mapping
 * function will skip the value. Falsy values are still included!
 *
 * Similar to https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.filter_map
 */
export function filterMap<In, Out>(
  list: readonly In[],
  fn: (value: In, index: number) => Out | undefined,
): Out[] {
  const result: Out[] = [];
  for (let i = 0; i < list.length; i++) {
    const mapped = fn(list[i], i);
    if (mapped !== undefined) {
      result.push(mapped);
    }
  }
  return result;
}

// Create a type from the keys of an object type that map to values of type PropType
type PropertiesOfType<T, PropType> = keyof {
  [K in keyof T as T[K] extends PropType ? K : never]: T[K];
};

/**
 * This is similar to _.keyBy, but it specifically handles keying multiple times per item, where
 * the keys come from an array property.
 *
 * given the key 'key', turns
 * [           { key: [1, 3] },      { key: [2, 4] } ]
 * into { '1': { key: [1, 3] }, '2': { key: [2, 4], '3': { key: [1, 3] }, '4': { key: [2, 4] } }
 */
export function objectifyArray<T>(array: T[], key: PropertiesOfType<T, any[]>): NodeJS.Dict<T> {
  return array.reduce<NodeJS.Dict<T>>((acc, val) => {
    const prop = val[key] as string[];
    for (const eachKeyName of prop) {
      acc[eachKeyName] = val;
    }
    return acc;
  }, {});
}

/**
 * Given an index into an array, which may exceed the bounds of the array in either direction,
 * return a new index that "wraps around".
 *
 * @example
 * [0, 1][wrap(-1, 2)] === 1
 */
export const wrap = (index: number, length: number) => {
  while (index < 0) {
    index += length;
  }
  while (index >= length) {
    index -= length;
  }
  return index;
};

/**
 * A faster replacement for _.uniqBy that uses a Set internally
 */
export function uniqBy<T, K>(data: Iterable<T>, iteratee: (input: T) => K): T[] {
  const dedupe = new Set<K>();
  const result: T[] = [];
  for (const d of data) {
    const mapped = iteratee(d);
    if (!dedupe.has(mapped)) {
      result.push(d);
      dedupe.add(mapped);
    }
  }
  return result;
}

/**
 * Immutably reorder a list by moving an element at index `startIndex` to
 * `endIndex`. Helpful for drag and drop. Returns a copy of the initial list.
 */
export function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}
