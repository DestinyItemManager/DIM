(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimSearchFilter', SearchFilter);

  SearchFilter.$inject = [];

  function SearchFilter() {
    return {
      controller: SearchFilterCtrl,
      controllerAs: 'vm',
      bindToController: true,
      restrict: 'A',
      template: [
        '<input placeholder="filter items or is:arc" type="search" name="filter" ng-model="vm.search" ng-model-options="{ debounce: 500 }" ng-trim="true" ng-change="vm.filter()">'
      ].join('')
    };
  }

  SearchFilterCtrl.$inject = ['$scope', 'dimStoreService', '$timeout'];

  function SearchFilterCtrl($scope, dimStoreService, $timeout) {
    var vm = this;

    $scope.$on('dim-stores-updated', function(arg) {
      vm.filter();
    });

    vm.filter = function() {

      var filterValue = (vm.search) ? vm.search.toLowerCase() : '';
      var filterResults;
      var filterResult = '';
      var filterFn;
      var tempFns = {
        is: [],
        not: []
      };

      var isSpecial = !!~filterValue.indexOf('is:');
      var notSpecial = !!~filterValue.indexOf('not:');

      if (isSpecial) {
        filterResults = filterValue.split('is:');

        _.each(filterResults, function(filterResult) {
          filterResult = filterResult.trim();

          if (filterResult !== '') {
            isSpecial = _checkSpecial(filterResult) || isSpecial;

            tempFns.is.push(filterGenerator(filterResult, isSpecial));
          }
        });
      } else if(notSpecial) {
        filterResults = filterValue.split('not:');

        _.each(filterResults, function(filterResult) {
          filterResult = filterResult.trim();

          if (filterResult !== '') {
            isSpecial = _checkSpecial(filterResult) || isSpecial;

            tempFns.not.push(filterGenerator(filterResult, isSpecial));
          }
        });
      } else {
        tempFns.is.push(filterGenerator(filterValue, ''));
      }

      filterFn = function(item) {
        var fn = (_.reduce(tempFns.is, function(memo, fn) {
          return memo || fn(item);
        }, false));

        // Try "not:"
        if(!fn)
          fn = (_.reduce(tempFns.not, function(memo, fn) {
            return memo || !fn(item);
          }, false));

        // Back to default. Probably something better to be done here
        return fn || (_.reduce(tempFns.is, function(memo, fn) {
          return memo || fn(item);
        }, false));

      };

      _.each(dimStoreService.getStores(), function(store) {
        _.chain(store.items)
          .each(function(item) {
            item.visible = !filterFn(item);
          });
      });

      $timeout(dimStoreService.setHeights, 32);
    };

    var _filterFns = {
      'elemental': function(p, item) {
        return (item.dmg !== p);
      },
      'type': function(p, item) {
        return (item.type.toLowerCase() !== p);
      },
      'tier': function(p, item) {
        return (item.tier.toLowerCase() !== p);
      },
      'incomplete': function(p, item) {
        return ((item.complete === true || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class')) || ((item.xpComplete && item.hasXP) || (!item.hasXP)));
      },
      'complete': function(p, item) {
        return (item.complete === false) || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class');
      },
      'xpincomplete': function(p, item) {
        return (item.xpComplete && item.hasXP) || (!item.hasXP);
      },
      'xpcomplete': function(p, item) {
        return (!item.xpComplete && item.hasXP) || (!item.hasXP);
      },
      'upgraded': function(p, item) {
        return ((item.complete === true || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class')) || ((!item.xpComplete && item.hasXP) || (!item.hasXP)));
      },
      'classType': function(p, item) {
        var value;
        switch (p) {
          case 'titan':
            value = 0;
            break;
          case 'hunter':
            value = 1;
            break;
          case 'warlock':
            value = 2;
            break;
        }
        return (item.classType !== value);
      },
      'stackable': function(p, item) {
        return item.maxStackSize <= 1;
      }
    };

    var filterGenerator = function(predicate, switchParam) {
      var _duplicates = {};

      var result = function(p, item) {
        return (item.name.toLowerCase().indexOf(p) === -1);
      }

      if(_filterFns.hasOwnProperty(switchParam) && !~['dupe', 'duplicate'].indexOf(switchParam))
        result = _filterFns[switchParam];
      else if(!!~['dupe', 'duplicate'].indexOf(switchParam))
      {
        result = function(p, item){
          if (!_duplicates.hasOwnProperty('dupes')) {
            var allItems = _.chain(dimStoreService.getStores())
              .map(function(store) {
                return store.items;
              })
            .flatten()
              .sortBy('hash')
              .value();
            _duplicates.dupes = [];
            for (var i = 0; i < allItems.length - 1; i++) {
              if (allItems[i + 1].hash == allItems[i].hash) {
                _duplicates.dupes.push(allItems[i].hash);
              }
            }
          }
          return !_.some(_duplicates.dupes, function(hash) { return item.hash === hash; });
        };
      }

      return result.bind(null, predicate);
    };
  }

  /**
   * Can easily add more filter sets
   * '<key>': [Array of possible matches]
   * Key is what filter should be used
   * Array is what will be searched for
   */
  var _filterSets = {
    'elemental': ['arc', 'solar', 'void', 'kinetic'],
    'type': ['primary', 'special', 'heavy', 'helmet', 'leg', 'gauntlets', 'chest', 'class', 'classitem'],
    'tier': ['common', 'uncommon', 'rare', 'legendary', 'exotic'],
    'incomplete': ['incomplete'],
    'complete': ['complete'],
    'xpincomplete': ['xpincomplete'],
    'xpcomplete': ['xpcomplete'],
    'upgraded': ['upgraded'],
    'classType': ['titan', 'hunter', 'warlock'],
    'dupe': ['dupe', 'duplicate'],
    'stackable': ['stackable']
  };

  function _checkSpecial(filterResult)
  {
    for(var key in _filterSets)
      if(_filterSets.hasOwnProperty(key) && !!~_filterSets[key].indexOf(filterResult))
        return key;
  }
})();
