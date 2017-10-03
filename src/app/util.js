import _ from 'underscore';

// Some utility functions missing from underscore
function sum(list, summer) {
  const fn = _.iteratee(summer);
  return _.reduce(list, (memo, val, index) => {
    return memo + fn(val, index);
  }, 0);
}

// Count the number of "true" values
function count(list, predicate) {
  const fn = _.iteratee(predicate);
  return sum(list, (item, index) => {
    return fn(item, index) ? 1 : 0;
  });
}

// A replacement for _.compact(_.flatten(_.map(c, fn))) that is more efficient.
function flatMap(list, fx) {
  const fn = _.iteratee(fx);
  const res = [];
  Object.keys(list).forEach((item) => {
    const resList = fn(list[item]);
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

export { sum, count, flatMap };
