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

/**
 * A fast/light alternative to Object.keys(obj).length === 0.
 */
export function isEmpty<T extends object | undefined | null>(obj: T) {
  if (!obj) {
    return true;
  }
  // eslint-disable-next-line no-unreachable-loop
  for (const _key in obj) {
    return false;
  }
  return true;
}

type NotFalsey<T> = Exclude<T, false | null | 0 | 0n | '' | undefined>;

/**
 * Removes falsy values (false, null, 0, 0n, '', undefined, NaN) from an array.
 * This is just as fast as es-toolkit's compact but it's less code.
 */
export function compact<T>(arr: readonly T[]): NotFalsey<T>[] {
  return arr.filter((item) => item) as NotFalsey<T>[];
}

/**
 * Return a new object with the same keys, but values that are the result of
 * calling a mapping function on each value. If the mapping function returns
 * undefined, the key is omitted from the new object. This is slightly faster
 * than es-toolkit's mapValues plus it has the undefined-filtering behavior.
 */
export function mapValues<T extends object, K extends keyof T & string, V>(
  object: T,
  getNewValue: (value: Exclude<T[keyof T], undefined>, key: K) => V,
): { [K in keyof T]: V } {
  return Object.entries(object).reduce(
    (acc, [key, value]) => {
      if (value === undefined) {
        return acc;
      }
      const newValue = getNewValue(value as Exclude<T[keyof T], undefined>, key as K);
      if (newValue !== undefined) {
        acc[key as K] = newValue;
      }
      return acc;
    },
    {} as { [K in keyof T]: V },
  );
}

/**
 * Invert produces a new object where the keys and values are swapped. This is
 * slightly faster than es-toolkit's invert and handles undefined values plus
 * optional conversion of string keys to values.
 */
export function invert<K extends string, V extends PropertyKey | undefined, VV = string>(
  obj: Record<K, V>,
  keyTransform?: (key: string) => VV,
): Record<Exclude<V, undefined>, VV> {
  return Object.entries<V>(obj).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        const newValue = keyTransform ? keyTransform(key) : key;
        if (newValue !== undefined) {
          // @ts-expect-error ts(2322)
          acc[value] = newValue as VV;
        }
      }
      return acc;
    },
    {} as Record<Exclude<V, undefined>, VV>,
  );
}

/**
 * A version of "maxBy" that returns the max of the mapping function, not the
 * original item from the array that *produced* the max value. This is
 * equivalent to `Math.max(...items.map(getValue))` but more efficient.
 */
export function maxOf<T>(items: readonly T[], getValue: (element: T) => number): number {
  let max = -Infinity;

  for (const element of items) {
    const value = getValue(element);
    if (value > max) {
      max = value;
    }
  }

  return max;
}

/**
 * A version of "minBy" that returns the min of the mapping function, not the
 * original item from the array that *produced* the min value. This is
 * equivalent to `Math.min(...items.map(getValue))` but more efficient.
 */
export function minOf<T>(items: readonly T[], getValue: (element: T) => number): number {
  let min = Infinity;

  for (const element of items) {
    const value = getValue(element);
    if (value < min) {
      min = value;
    }
  }

  return min;
}

/**
 * Sum the results of calling a mapping function on each element of the array.
 * If the array is empty, this function returns `0`. This is more
 * memory-efficient than es-toolkit's sumBy but could be removed if
 * https://github.com/toss/es-toolkit/pull/753 is merged.
 */
export function sumBy<T>(items: readonly T[], getValue: (element: T) => number): number {
  return items.reduce((total, x) => total + getValue(x), 0);
}
