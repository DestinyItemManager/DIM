import * as _ from 'lodash';
import { loadingTracker } from './ngimport-more';

/**
 * Count the number of values in the list that pass the predicate.
 */
export function count<T>(list: T[], predicate: (value: T) => boolean): number {
  return _.sumBy(list, (item) => {
    return predicate(item) ? 1 : 0;
  });
}

/** A shallow copy (just top level properties) of an object, preserving its prototype. */
export function shallowCopy<T>(o: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(o)), o);
}

export function trackPromise<T extends any[], K>(
  promiseFn: (...args: T) => Promise<K>
): (...args: T) => Promise<K> {
  return (...args: T) => {
    const promise = promiseFn.apply(null, args);
    loadingTracker.addPromise(promise);
    return promise;
  };
}
