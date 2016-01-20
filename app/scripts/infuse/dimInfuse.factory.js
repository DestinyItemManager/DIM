(function() {
  'use strict';

  angular.module('dimApp')
    .factory('infuseService', infuseService);

  infuseService.$inject = ['dimWebWorker'];

  function infuseService(dimWebWorker) {

    var _data = {
      source: null,
      targets: [],
      infused: 0,
      exotic: false,
      view: [],
      infusable: [],
      calculating: false,
      calculate: function() {
        var result = _data.source.primStat.value;

        _data.targets.forEach(function(target) {
          result = InfuseUtil.infuse(result, target.primStat.value, _data.exotic);
        });

        return result;
      }
    };

    return {
      isCalculating: function() {
        return _data.calculating;
      },
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
        if (_data.calculating) return; // no work to do

        var worker = new dimWebWorker({
          fn:function(args) {
            var data = JSON.parse(args.data);
            var max = InfuseUtil.maximizeAttack(data.infusable, data.source, data.exotic);

            if (!max) {
              this.postMessage('undefined');
            }
            else {
              this.postMessage(JSON.stringify(max));
            }
          },
          include:['vendor/underscore/underscore-min.js', 'scripts/infuse/dimInfuse.util.js']
        });

        _data.calculating = true;
        worker.do(JSON.stringify(_data))
        .then(function(message) {
          _data.calculating = false;

          if (message === 'undefined') return; // no suitable path found

          var max = JSON.parse(message);

          _data.view       = []; // there are no other options
          _data.targets    = max.path;
          _data.infused    = max.light;
          _data.difference = _data.infused - _data.source.primStat.value;
        })
        .then(function() {
          // cleanup worker
          worker.destroy();
        });
      },
      data: _data
    };

  }

})();
