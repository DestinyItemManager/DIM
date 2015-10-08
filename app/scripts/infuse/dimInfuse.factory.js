(function() {
  'use strict';

  angular.module('dimApp')
    .factory('infuseService', infuseService);

  infuseService.$inject = [];

  function infuseService() {

    var _data = {
      source: null,
      targets: [],
      infused: 0,
      view: [],
      infusable: [],
      calculate: function() {

        var result = 0;
        var source = _data.source.primStat.value;

        // Exotics guaranteed up to 4; legendaries, 6
        // Otherwise, take a percentage.  Exotics get 70%
        var guarantee  = (_data.source.tier === 'Exotic') ? 4 : 6;
        var multiplier = (_data.source.tier === 'Exotic') ? 0.7 : 0.8;

        for(var i=0;i<_data.targets.length;i++) {
          var target = _data.targets[i].primStat.value;
          // if we already have a partial
          if (result > 0) {
            var source = result;
          }

          // infuse at 100% if difference not greater than the guarantee
          if (target - source <= guarantee) {
            result = target;
          }
          else {
            // result = Math.round((target - source) * multiplier + source);
            // Some says...that numbers are Ceiling...not rounded
            result = Math.ceil((target - source) * multiplier + source);
          }
        }
        return result;
      }
    };

    return {
      setSourceItem: function(item) {
        // Set the source and reset the targets
        _data.source = item;
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
