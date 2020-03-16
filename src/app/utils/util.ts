import _ from 'lodash';

/**
 * Count the number of values in the list that pass the predicate.
 */
export function count<T>(list: T[], predicate: (value: T) => boolean): number {
  return _.sumBy(list, (item) => (predicate(item) ? 1 : 0));
}

/** A shallow copy (just top level properties) of an object, preserving its prototype. */
export function shallowCopy<T>(o: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(o)), o);
}

export function preventNaN(testValue, defaultValue) {
  return !isNaN(testValue) ? testValue : defaultValue;
}

/**
 * given @key 'key', turns
 * [           { key: '1' },      { key: '2' } ]
 * into { '1': { key: '1' }, '2': { key: '2' } }
 */
// i should be able to make this work though
// export function objectifyArray<T, K extends keyof T>( array: T[],  key: string ): { [k: T[K]]: T };
// export function objectifyArray<T>(  array: T[],  key: ((obj: any) => number)): { [k: number]: T };
// export function objectifyArray<T>(  array: T[],  key: ((obj: any) => string)): { [k: string]: T };
export function objectifyArray<T>(
  array: T[],
  key: string | ((obj: any) => number)
): { [key: number]: T };
export function objectifyArray<T>(
  array: T[],
  key: string | ((obj: any) => string)
): { [key: string]: T };
export function objectifyArray<T>(array: T[], key: string | ((obj: any) => string | number)) {
  return array.reduce((acc, val) => {
    if (typeof key === 'string') acc[val[key]] = val;
    else acc[key(val)] = val;
    return acc;
  }, {});
}

/**
 * Produce a function that can memoize a calculation about an item. The cache is backed by
 * a WeakMap so when the item is garbage collected the cache is freed up too.
 */
export function weakMemoize<T extends object, R>(func: (T) => R): (T) => R {
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
export function dedupePromise<T extends any[], K>(
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
