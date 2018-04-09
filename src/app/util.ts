import * as _ from 'lodash';

/**
 * Count the number of values in the list that pass the predicate.
 */
export function count<T>(list: T[], predicate: (value: T) => boolean): number {
  return _.sumBy(list, (item) => {
    return predicate(item) ? 1 : 0;
  });
}
