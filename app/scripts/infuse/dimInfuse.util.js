var InfuseUtil = {

  halfToEven: function(n) {
      var i = Math.floor(n),
          f = (n - i).toFixed(8),
          e = 1e-8; // Allow for rounding errors in f
      return (f > 0.5 - e && f < 0.5 + e) ?
          ((i % 2 == 0) ? i : i + 1) : Math.round(n);
  },
  // huge props to /u/Apswny https://github.com/Apsu
  infuse: function(source, target, exotic) {
    var diff = target - source;

    if (diff <= (exotic ? 4 : 6)) {
        return target;
    }
    return source + InfuseUtil.halfToEven(diff * (exotic ? 0.7 : 0.8));
  },
  walkPaths: function(list, cameFrom, paths, currentStat, source, sourceIsExotic) {
    var start = -1;

    // find the first viable item
    start = _.findIndex(list, function(item) {
      return item.primStat.value > currentStat;
    });
    // base case, we've exhausted the list of viable targets
    if (start === -1) return;

    for (;start != list.length;++start) {
      var currentNodes = cameFrom.slice(0); // clone
      currentNodes.push(list[start]);

      var result = InfuseUtil.infuse(currentStat, list[start].primStat.value, sourceIsExotic);

      // see if a current path exists
      var existingPath = _.find(paths, function(p) {
        return p.light === result;
      });
      if (existingPath) {
          // let's see if this one beats it
        if (currentNodes.length < existingPath.path.length) {
          existingPath.path = currentNodes; // better path
        }
      }
      else {
        paths.push({light:result, path:currentNodes}); // add the current path
      }

      // move to next node (depth first)
      var next = list.slice(0); // clone
      next.splice(start, 1); // remove current node
      InfuseUtil.walkPaths(next, currentNodes, paths, result, source, sourceIsExotic);
    }
  },
  maximizeAttack: function(possibleTargets, source, sourceIsExotic) {
    // we want to use the entire list of infusable items but only use the ones that are possible infusion targets
    var paths = [];
    InfuseUtil.walkPaths(possibleTargets, [], paths, source.primStat.value, source, sourceIsExotic);

    if (_.isEmpty(paths)) return undefined; // no suitable path found

    // find the max light stat
    var max = _.max(paths, function(path) {
      return path.light;
    });

    return max;
  }

};