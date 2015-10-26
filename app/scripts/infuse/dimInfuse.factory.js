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
      calculate: function() {
        var result = _data.source.primStat.value;

        _data.targets.forEach(function(target) {
          result = _data.infuse(result, target.primStat.value);
        });
        return result;
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
          _data.targets.push(item);
        }

        // Value of infused result
        _data.infused = _data.calculate();
        // The difference from start to finish
        _data.difference = _data.infused - _data.source.primStat.value;

        // let's remove the used gear and the one that are lower than the infused result
        _data.view = _.chain(_data.infusable)
          .difference(_data.targets)
          .filter(function(item) {
            return item.primStat.value > _data.infused;
          })
          .value();

      },
      data: _data,
    }

  }

})();
