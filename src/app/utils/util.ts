import _ from 'lodash';
import { tempContainer } from './temp-container';

/**
 * Count the number of values in the list that pass the predicate.
 */
export function count<T>(
  list: readonly T[],
  predicate: (value: T) => boolean | null | undefined
): number {
  return _.sumBy(list, (item) => (predicate(item) ? 1 : 0));
}

export function preventNaN<T extends number | string>(testValue: number, defaultValue: T) {
  return !isNaN(testValue) ? testValue : defaultValue;
}

/**
 * given the key 'key', turns
 * [           { key: '1' },      { key: '2' } ]
 * into { '1': { key: '1' }, '2': { key: '2' } }
 */
export function objectifyArray<T>(
  array: T[],
  key: keyof T | ((obj: T) => keyof T)
): NodeJS.Dict<T> {
  return array.reduce<NodeJS.Dict<T>>((acc, val) => {
    if (_.isFunction(key)) {
      acc[key(val) as string] = val;
    } else {
      const prop = val[key];
      if (typeof prop === 'string') {
        acc[prop] = val;
      } else if (Array.isArray(prop)) {
        for (const eachKeyName of prop) {
          acc[eachKeyName] = val;
        }
      } else {
        const keyName = JSON.stringify(prop);
        acc[keyName] = val;
      }
    }
    return acc;
  }, {});
}

/**
 * Produce a function that can memoize a calculation about an item. The cache is backed by
 * a WeakMap so when the item is garbage collected the cache is freed up too.
 */
export function weakMemoize<T extends object, R>(func: (arg0: T) => R): (arg1: T) => R {
  const cache = new WeakMap<T, R>();
  return (arg: T): R => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const value = func(arg);
    cache.set(arg, value);
    return value;
  };
}

/**
 * Transform an async function into a version that will only execute once at a time - if there's already
 * a version going, the existing promise will be returned instead of running it again.
 */
export function dedupePromise<T extends unknown[], K>(
  func: (...args: T) => Promise<K>
): (...args: T) => Promise<K> {
  let promiseCache: Promise<K> | null = null;
  return async (...args: T) => {
    if (promiseCache) {
      return promiseCache;
    }
    promiseCache = func(...args);
    try {
      return await promiseCache;
    } finally {
      promiseCache = null;
    }
  };
}

// setTimeout as a promise
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Copy a string to the clipboard */
export function copyString(str: string) {
  navigator.clipboard.writeText(str);
}

/** Download a string as a file */
export function download(data: string, filename: string, type: string) {
  const a = document.createElement('a');
  a.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(data)}`);
  a.setAttribute('download', filename);
  tempContainer.appendChild(a);
  a.click();
  setTimeout(() => tempContainer.removeChild(a));
}

/**
 * Given an index into an array, which may exceed the bounds of the array in either direction,
 * return a new index that "wraps around".
 *
 * Example:
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
