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
        '<input id="filter-input" placeholder="filter items or is:arc" type="search" name="filter" ng-model="vm.search.query" ng-model-options="{ debounce: 500 }" ng-trim="true" ng-change="vm.filter()">'
      ].join('')
    };
  }

  SearchFilterCtrl.$inject = ['$scope', 'dimStoreService', '$timeout', '$interval'];

  function SearchFilterCtrl($scope, dimStoreService, $timeout, $interval) {
    var vm = this;
    var filterInputSelector = '#filter-input';

    vm.search = {
      'query': ""
    };

    $scope.$on('dim-stores-updated', function(arg) {
      vm.filter();
    });

    $scope.$on('dim-focus-filter-input', function(arg) {
      vm.focusFilterInput();
    });

    $scope.$on('dim-escape-filter-input', function(arg) {
      vm.blurFilterInputIfEmpty();
      vm.clearFilter();
    });

    $scope.$on('dim-clear-filter-input', function(arg) {
      vm.clearFilter();
    });

    $scope.$on('dim-active-platform-updated', function(event, args) {
      $scope.filterTimer = $interval(function () {
        // Wait until the interface has finished loading.
        if (!$scope.loadingTracker.active() && !$scope.isUserInactive()) {
          vm.filter();
          $interval.cancel($scope.filterTimer);
        }
      }, 300);
    });

    vm.blurFilterInputIfEmpty = function () {
      if (vm.search.query === "") {
        vm.blurFilterInput();
      }
    };

    vm.focusFilterInput = function () {
      $(filterInputSelector).focus();
    };

    vm.blurFilterInput = function () {
      $(filterInputSelector).blur();
    };

    vm.clearFilter = function () {
      vm.search.query = "";
      vm.filter();
    };

    vm.filter = function() {
      var filterValue = (vm.search.query) ? vm.search.query.toLowerCase() : '';
      var filterResults;
      var filterResult = '';
      var filterFn;
      var tempFns = [];
      var special = filterValue.indexOf('is:') >= 0;
      var filters = [];

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
            filters.push({predicate: special, value: filterResult});
            tempFns.push(filterGenerator(filterResult, special));
          }
        });
      } else {
        tempFns.push(filterGenerator(filterValue, ''));
      }

      filterFn = function(item) {
        var checks = 0;
        _.each(filters, function(filter){
          if(item.hasOwnProperty([filter.predicate])){
            if(item[filter.predicate]){
              item[filter.predicate].toLowerCase() === filter.value ? checks++ : null;
            }
          }
        });
        return checks === filters.length ? true : false;
      };

      _.each(dimStoreService.getStores(), function(store) {
        _.chain(store.items)
          .each(function(item) {
            filters.length > 0 ? item.visible = filterFn(item) : item.visible = true;
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
      'dmg':          ['arc', 'solar', 'void', 'kinetic'],
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
      'unlocked':     ['unlocked'],
      'stackable':    ['stackable'],
      'weaponClass':  ["pulserifle", "scoutrifle", "handcannon", "autorifle", "primaryweaponengram", "sniperrifle", "shotgun", "fusionrifle", "specialweaponengram", "rocketlauncher", "machinegun", "heavyweaponengram", "sidearm"]
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
      'dmg': function(predicate, item) {
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
      },
      'stackable': function(predicate, item) {
        return item.maxStackSize > 1;
      },
      'weaponClass': function(predicate, item) {
        return predicate.toLowerCase().replace(/\s/g, '') == item.weaponClass;
      }
    };
  }
})();
