var InfuseUtil = {

  halfToEven: function(n) {
      var i = Math.floor(n),
          f = (n - i).toFixed(8),
          e = 1e-8; // Allow for rounding errors in f
      return (f > 0.5 - e && f < 0.5 + e) ?
          ((i % 2 === 0) ? i : i + 1) : Math.round(n);
  },

  /**
   * Calculate the new atk/def (light) of an item if target were infused into
   * source.
   *
   * Huge props to /u/Apswny https://github.com/Apsu
   *
   * @param {number} source primary stat of the source item.
   * @param {number} target primary stat of the target item.
   * @param {boolean} exotic Whether source is exotic.
   * @return {number} the new stat after infusion
   */
  infuse: function(source, target, exotic) {
    var diff = target - source;

    // Within this difference, you get the full value of the infusion.
    if (diff <= (exotic ? 4 : 6)) {
        return target;
    }

    return source + InfuseUtil.halfToEven(diff * (exotic ? 0.7 : 0.8));
  },
  walkPaths: function(possibleTargets, cameFrom, paths, currentStat, source, sourceIsExotic) {
    // find the first viable item
    var candidateItemIndex = _.findIndex(possibleTargets, function(item) {
      return item.primStat.value > currentStat;
    });
    // base case, we've exhausted the list of viable targets
    if (candidateItemIndex === -1) {
      return;
    }

    var previousLight = 0;
    for (;candidateItemIndex != possibleTargets.length; ++candidateItemIndex) {
      var candidateItem = possibleTargets[candidateItemIndex];
      var newLight = InfuseUtil.infuse(currentStat, candidateItem.primStat.value, sourceIsExotic);

      // If this doesn't improve on the light we got in the previous iteraction, ignore it.
      if (newLight <= previousLight) {
        continue;
      }
      previousLight = newLight;

      var currentNodes = cameFrom.slice(0); // clone
      currentNodes.push(candidateItem);

      // see if a current path exists
      var existingPath = _.find(paths, function(p) {
        return p.light === newLight;
      });
      if (existingPath) {
        // let's see if this one beats it
        if (currentNodes.length < existingPath.path.length) {
          existingPath.path = currentNodes; // better path
        }
      } else {
        paths.push({light:newLight, path:currentNodes}); // add the current path
      }

      // move to next node (depth first)
      var next = possibleTargets.slice(candidateItemIndex + 1); // clone starting at next node after current
      InfuseUtil.walkPaths(next, currentNodes, paths, newLight, source, sourceIsExotic);
    }
  },
  maximizeAttack: function(possibleTargets, source, sourceIsExotic) {
    // we want to use the entire list of infusable items but only use the ones that are possible infusion targets
    var paths = [];
    InfuseUtil.walkPaths(possibleTargets, [], paths, source.primStat.value, source, sourceIsExotic);

    if (_.isEmpty(paths)) return undefined; // no suitable path found

    paths = _.sortBy(paths, function(path) {
      return -path.light;
    });

    return paths;
  }

};
