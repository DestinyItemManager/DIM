const _ = require('underscore');

// Some utility functions missing from underscore
window.sum = function sum(list, summer) {
  const fn = _.iteratee(summer);
  return _.reduce(list, function(memo, val, index) {
    return memo + fn(val, index);
  }, 0);
};

// Count the number of "true" values
window.count = function count(list, predicate) {
  const fn = _.iteratee(predicate);
  return sum(list, function(item, index) {
    return fn(item, index) ? 1 : 0;
  });
};

// A replacement for _.compact(_.flatten(_.map(l, fn))) that is more efficient.
window.flatMap = function flatMap(list, fx) {
  const fn = _.iteratee(fx);
  const res = [];
  list.forEach((item) => {
    const resList = fn(item);
    if (resList) {
      resList.forEach((resItem) => {
        if (resItem !== undefined && resItem !== null) {
          res.push(resItem);
        }
      });
    }
  });
  return res;
};
