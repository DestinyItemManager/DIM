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
      var tempFns = [];
      var special = filterValue.indexOf('is:') >= 0;

      if (special) {
        filterResults = filterValue.split('is:');

        _.each(filterResults, function(filterResult) {
          filterResult = filterResult.trim();

          if (filterResult !== '') {

            if(_cachedFilters[filterResult]) {
              special = _cachedFilters[filterResult];
            } else {
              for(var key in filterTrans) {
                if(filterTrans.hasOwnProperty(key) && !!~filterTrans[key].indexOf(filterResult)) {
                  special = key;
                  _cachedFilters[filterResult] = key;
                  break;
                }
              }
            }

            tempFns.push(filterGenerator(filterResult, special));
          }
        });
      } else {
        tempFns.push(filterGenerator(filterValue, ''));
      }

      filterFn = function(item) {
        return (_.reduce(tempFns, function(memo, fn) {
          return memo || fn(item);
        }, false));
      };

      _.each(dimStoreService.getStores(), function(store) {
        _.chain(store.items)
          .each(function(item) {
            item.visible = filterFn(item);
          });
      });

      $timeout(dimStoreService.setHeights, 32);
    };

    var filterGenerator = function(predicate, switchParam) {
      var result = function(predicate, item) {
        return !!~item.name.toLowerCase().indexOf(predicate);
      };

      if(filterFns.hasOwnProperty(switchParam)) {
        result = filterFns[switchParam];
      }

      return result.bind(null, predicate);
    };

    /**
     * Filter translation sets. Left-hand is the filter to run from filterFns, right side are possible filterResult
     * values that will set the left-hand to the "match."
     */
    var filterTrans = {
      'elemental':    ['arc', 'solar', 'void', 'kinetic'],
      'type':         ['primary', 'special', 'heavy', 'helmet', 'leg', 'gauntlets', 'chest', 'class', 'classitem'],
      'tier':         ['common', 'uncommon', 'rare', 'legendary', 'exotic'],
      'incomplete':   ['incomplete'],
      'complete':     ['complete'],
      'xpcomplete':   ['xpcomplete'],
      'xpincomplete': ['xpincomplete'],
      'upgraded':     ['upgraded'],
      'classType':    ['titan', 'hunter', 'warlock'],
      'dupe':         ['dupe', 'duplicate'],
      'unascended':   ['unascended', 'unassended', 'unasscended'],
      'ascended':     ['ascended', 'assended', 'asscended'],
      'locked':       ['locked'],
      'unlocked':     ['unlocked']
    };

    // Cache for searches against filterTrans. Somewhat noticebly speeds up the lookup on my older Mac, YMMV. Helps
    // make the for(...) loop for filterTrans a little more bearable for the readability tradeoff.
    var _cachedFilters = {};

    var _duplicates = {}; // Holds...well, duplicates

    /**
     * Filter groups keyed by type check. Key is what the user will search for, e.g.
     * is:complete
     *
     * Value is the checking function
     * @param {String} predicate The predicate - for example, is:arc gets the 'elemental' filter function, with predicate='arc'
     * @param {Object} item The item to test against.
     * @return {Boolean} Returns false for a match, true for a non-match (@TODO make this less confusing)
     */
    var filterFns = {
      'elemental': function(predicate, item) {
        return (item.dmg === predicate);
      },
      'type': function(predicate, item) {
        return (item.type.toLowerCase() === predicate);
      },
      'tier': function(predicate, item) {
        return (item.tier.toLowerCase() === predicate);
      },
      // @TODO This logic breaks my brain, I can't really reverse it tonight so just not(!)'ing it for now...cheap way
      // out I know. This applies to incomplete, complete, and upgraded
      'incomplete': function(predicate, item) {
        return !((item.complete !== true || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class')) || ((item.xpComplete && item.hasXP) || (!item.hasXP)));
      },
      'complete': function(predicate, item) {
        return !(item.complete === false) || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class');
      },
      'upgraded': function(predicate, item) {
        return ((item.complete === true || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class')) || ((!item.xpComplete && item.hasXP) || (!item.hasXP)));
      },
      'xpincomplete': function(predicate, item) {
        return item.hasXP && !item.xpComplete;
      },
      'xpcomplete': function(predicate, item) {
        return !item.hasXP || item.xpComplete;
      },
      'ascended': function(predicate, item) {
        return item.hasAscendNode && item.ascended;
      },
      'unascended': function(predicate, item) {
        return !filterFns.ascended(predicate, item);
      },
      'unlocked': function(predicate, item) {
        return item.lockable && !item.locked;
      },
      'locked': function(predicate, item) {
        return !filterFns.unlocked(predicate, item);
      },
      'dupe': function(predicate, item) {
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

        return _.some(_duplicates.dupes, function(hash) { return item.hash === hash; });
      },
      'classType': function(predicate, item) {
        var value;

        switch (predicate) {
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

        return (item.classType == value);
      }
    };
  }
})();
