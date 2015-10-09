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
      // huge props to /u/Apswny
      // https://www.reddit.com/r/destinythegame/comments/3n6pox/python_infusion_calculator
      getThreshold: function(target, source) {
        if(source.tier === 'Exotic') {
          // upgrade exotic with rare or legendary, threshold = 4
          if(target.tier === 'Rare' || target.tier === 'Legendary') return 4;

          // upgrade exotic with an exotic, threshold = 5
          if(target.tier === 'Exotic') return 5;
        }

        // infusing a rare or legendary with a rare or legendary, threshold = 6
        if((source.tier === 'Rare' || source.tier === 'Legendary') &&
           (source.tier === 'Rare' || source.tier === 'Legendary')) return 6;

        // otherwise we're upgradeing a rare/legendary with an exotic, threshold = 7
        return 7;
      },
      calculate: function() {
        var result = 0;
        var source = _data.source.primStat.value;

        // Exotics get 70%
        var multiplier = (_data.source.tier === 'Exotic') ? 0.7 : 0.8;

        for(var i=0;i<_data.targets.length;i++) {
          var target = _data.targets[i].primStat.value;
          // if we already have a partial
          if (result > 0) {
            var source = result;
          }
          // rares and legendaries that are within 6 points infuse at 100%
          if (target - source <= _data.getThreshold(_data.targets[i], _data.source)) {
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
