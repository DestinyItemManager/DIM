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
      // huge props to /u/Apswny https://github.com/Apsu
      calculate: function() {
        var base = _data.source.primStat.value,
            scaler = _data.source.tier === 'Exotic' ? 0.7 : 0.8,
            step = _data.source.tier === 'Exotic' ? 4 : 6;

        _data.targets.forEach(function(target) {
          var target = target.primStat.value,
              diff = target - base;

        if (diff <= step) {
            base = target;
          } else {
            base += Math.round(diff * scaler);
          }
        });
        return base;
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
