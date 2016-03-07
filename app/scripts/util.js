// Some utility functions missing from underscore
function sum(list, summer) {
  return _.reduce(list, function(memo, val, index) {
    return memo + _.iteratee(summer)(val, index);
  }, 0);
}

// Count the number of "true" values
function count(list, predicate) {
  return sum(list, function(item, index) {
    return _.iteratee(predicate)(item, index) ? 1 : 0;
  });
}

