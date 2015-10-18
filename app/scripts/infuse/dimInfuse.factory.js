(function() {
  'use strict';

  angular.module('dimApp')
    .factory('infuseService', infuseService);

  infuseService.$inject = [];

  function infuseService() {

    function halfToEven(n) {
        var i = Math.floor(n),
            f = (n - i).toFixed(8),
            e = 1e-8; // Allow for rounding errors in f
        return (f > 0.5 - e && f < 0.5 + e) ?
            ((i % 2 == 0) ? i : i + 1) : Math.round(n);
    }

    var _data = {
      source: null,
      targets: [],
      infused: 0,
      view: [],
      infusable: [],
      // huge props to /u/Apswny https://github.com/Apsu
      infuse: function(source, target) {
        var diff = target - source;

        if (diff <= (_data.exotic ? 4 : 6)) {
            return target;
        }
        return source + halfToEven(diff * (_data.exotic ? 0.7 : 0.8));
      },
      getInfusionResult: function(target, sourceItem, sourceStat) {
        var targetStat = target.primStat.value;

        // see if we can absorb the entire stat value
        if (targetStat - sourceStat <= _data.getThreshold(target, sourceItem)) {
          return targetStat;
        }

        // otherwise we take a % value
        var multiplier = (sourceItem.tier === 'Exotic')? 0.7: 0.8;
        return Math.round((targetStat - sourceStat) * multiplier + sourceStat);
      },
      getInfusionResult: function(target, sourceItem, sourceStat) {
        var targetStat = target.primStat.value;

        // see if we can absorb the entire stat value
        if (targetStat - sourceStat <= _data.getThreshold(target, sourceItem)) {
          return targetStat;
        }

        // otherwise we take a % value
        var multiplier = (sourceItem.tier === 'Exotic')? 0.7: 0.8;
        return Math.round((targetStat - sourceStat) * multiplier + sourceStat);
      },
      calculate: function() {
        var result = _data.source.primStat.value;

        _data.targets.forEach(function(target) {
          result = _data.infuse(result, target.primStat.value);
        });
        return result;
      },
      walkPaths: function(list, cameFrom, paths, currentStat) {
        var start = -1;

        // find the first viable item
        var start = _.findIndex(list, function(item) {
          return item.primStat.value > currentStat;
        });
        // base case, we've exhausted the list of viable targets
        if (start === -1) return;

        for (;start != list.length;++start) {
          var currentNodes = cameFrom.slice(0); // clone
          currentNodes.push(list[start]);

          var result = _data.getInfusionResult(list[start], _data.source, currentStat);

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
          _data.walkPaths(next, currentNodes, paths, result);
        }
      },
      maximizeAttack: function() {
        // we want to use the entire list of infusable items but only use the ones that are possible infusion targets
        var possibleTargets = _data.infusable.slice(0); // clone
        var paths = [];
        _data.walkPaths(possibleTargets, [], paths, _data.source.primStat.value);

        if (_.isEmpty(paths)) return; // no suitable path found

        // find the max light stat
        var max = _.max(paths, function(path) {
          return path.light;
        });

        // apply to view
        _data.view       = []; // there are no other options
        _data.targets    = max.path;
        _data.infused    = max.light;
        _data.difference = _data.infused - _data.source.primStat.value;
      }
    };

    return {
      setSourceItem: function(item) {
        // Set the source and reset the targets
        _data.source = item;
        _data.exotic = _data.source.tier === 'Exotic';
        _data.infused = 0;
        _data.targets = [];
      },
      setInfusibleItems: function(items) {
        _data.infusable = items;
        _data.view = items;
      },
      toggleItem: function(item) {

        // Add or remove the item from the infusion chain
        var index = _.indexOf(_data.targets, item);
        if (index > -1) {
          _data.targets.splice(index, 1);
        }
        else {
          var sortedIndex = _.sortedIndex(_data.targets, item,
                                          function(i) { return i.primStat.value; });
          _data.targets.splice(sortedIndex, 0, item);
        }

        // Value of infused result
        _data.infused = _data.calculate();
        // The difference from start to finish
        _data.difference = _data.infused - _data.source.primStat.value;

        // let's remove the used gear and the one that are lower than the infused result
        _data.view = _.chain(_data.infusable)
          .difference(_data.targets)
          .select(function(item) {
            return item.primStat.value > _data.infused;
          })
          .value();

      },
      maximizeAttack: function() {
        _data.maximizeAttack();
      },
      data: _data
    };

  }

})();
