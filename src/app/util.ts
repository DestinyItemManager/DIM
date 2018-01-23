import * as _ from 'underscore';

// Some utility functions missing from underscore

/**
 * Sum the result of transforming each element of list by a function, without
 * creating an intermediate array.
 */
export function sum<T>(list: T[], summer: _.ListIterator<T, number>): number {
  const fn = _.iteratee(summer) as _.ListIterator<T, number>;
  return _.reduce(list, (memo, val, index) => {
    return memo + fn(val, index, list);
  }, 0);
}

/**
 * Count the number of values in the list that pass the predicate.
 */
export function count<T>(list: T[], predicate: _.ListIterator<T, any>): number {
  const fn = _.iteratee(predicate) as _.ListIterator<T, any>;
  return sum(list, (item, index) => {
    return fn(item, index, list) ? 1 : 0;
  });
}

/**
 * A replacement for _.compact(_.flatten(_.map(c, fn))) that is more efficient.
 */
export function flatMap<T, TResult>(list: T[], fx: _.ListIterator<T, TResult[]>): TResult[] {
  const fn = _.iteratee(fx) as _.ListIterator<T, TResult[]>;
  const res: TResult[] = [];
  _.each(list, (item, index, list) => {
    const resList = fn(item, index, list);
    if (resList) {
      resList.forEach((resItem) => {
        if (resItem !== undefined && resItem !== null) {
          res.push(resItem);
        }
      });
    }
  });
  return res;
}
