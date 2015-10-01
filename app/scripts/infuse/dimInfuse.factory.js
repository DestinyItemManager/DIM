(function() {
  'use strict';

  angular.module('dimApp')
    .factory('infuseService', infuseService);

  infuseService.$inject = [];

  function infuseService() {

    var _data = {
      source: 0,
      targets: [],
      infused: 0,
      view: [],
      infusable: [],
      calculate: function() {
        var result = 0;
        for(var i=0;i<_data.targets.length;i++) {
          var target = _data.targets[i].primStat.value;
          if (result > 0) { var source = result; }
          else { var source = _data.source; }
          result = Math.round((target - source) * 0.8 + source);
        }
        return result;
      }
    };

    return {
      setSource: function(source) {
        // Set the source and reset the targets
        _data.source = source;
        _data.infused = 0;
        _data.targets = [];
      },
      setInfusable: function(items) {
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
        _data.difference = _data.infused - _data.source;

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
