(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimSearchFilter', SearchFilter);

  SearchFilter.$inject = [];

  function SearchFilter() {
    return {
      controller: SearchFilterCtrl,
      controllerAs: 'vm',
      link: Link,
      bindToController: true,
      restrict: 'A',
      template: [
        '<input id="filter-input" placeholder="Search or is:arc" type="search" name="filter" ng-model="vm.search.query" ng-model-options="{ debounce: 500 }" ng-trim="true" ng-change="vm.filter()">'
      ].join('')
    };
  }

  /**
   * Filter translation sets. Left-hand is the filter to run from filterFns, right side are possible filterResult
   * values that will set the left-hand to the "match."
   */
  var filterTrans = {
    'dmg':          ['arc', 'solar', 'void', 'kinetic'],
    'type':         ['primary', 'special', 'heavy', 'helmet', 'leg', 'gauntlets', 'chest', 'class', 'classitem', 'artifact', 'ghost', 'horn', 'consumable', 'ship', 'material', 'vehicle', 'emblem', 'bounties', 'quests', 'messages', 'missions', 'emote'],
    'tier':         ['common', 'uncommon', 'rare', 'legendary', 'exotic'],
    'incomplete':   ['incomplete'],
    'complete':     ['complete'],
    'xpcomplete':   ['xpcomplete'],
    'xpincomplete': ['xpincomplete', 'needsxp'],
    'upgraded':     ['upgraded'],
    'classType':    ['titan', 'hunter', 'warlock'],
    'dupe':         ['dupe', 'duplicate'],
    'unascended':   ['unascended', 'unassended', 'unasscended'],
    'ascended':     ['ascended', 'assended', 'asscended'],
    'reforgeable':  ['reforgeable', 'reforge', 'rerollable', 'reroll'],
    'locked':       ['locked'],
    'unlocked':     ['unlocked'],
    'stackable':    ['stackable'],
    'engram':       ['engram'],
    'weaponClass':  ['pulserifle', 'scoutrifle', 'handcannon', 'autorifle', 'primaryweaponengram', 'sniperrifle', 'shotgun', 'fusionrifle', 'specialweaponengram', 'rocketlauncher', 'machinegun', 'heavyweaponengram', 'sidearm', 'sword'],
    'year':         ['year1', 'year2']
  };

  var keywords = _.flatten(_.values(filterTrans)).map(function(word) {
    return "is:" + word;
  });
  keywords.push("light:<", "light:>", "light:<=", "light:>=",
                "level:<", "level:>", "level:<=", "level:>=");

  function Link(scope, element, attrs) {
    element.find('input').textcomplete([
      {
        words: keywords,
        match: /\b((li|le|is:)\w*)$/,
        search: function (term, callback) {
          callback($.map(this.words, function (word) {
            return word.indexOf(term) === 0 ? word : null;
          }));
        },
        index: 1,
        replace: function (word) {
          return word.indexOf('is:') === 0 ? (word + ' ') : word;
        }
      }
    ], {
      zIndex: 1000
    });
  }

  SearchFilterCtrl.$inject = ['$scope', 'dimStoreService', '$interval', 'dimSettingsService'];

  function SearchFilterCtrl($scope, dimStoreService, $interval, dimSettingsService) {
    var vm = this;
    var filterInputSelector = '#filter-input';
    var _duplicates = null; // Holds a map from item hash to count of occurrances of that hash

    vm.search = {
      'query': ""
    };

    $scope.$on('dim-stores-updated', function(arg) {
      _duplicates = null;
      vm.filter();
    });

    // Something has changed that could invalidate filters
    $scope.$on('dim-filter-invalidate', function(arg) {
      _duplicates = null;
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
      var searchTerms = filterValue.split(" ");
      var filter, predicate = '';
      var filterFn;
      var filters = [];

      function addPredicate(predicate, filter){
        filters.push({predicate: predicate, value: filter});
      }

      _.each(searchTerms, function(term){
        if(term.indexOf('is:') >=0) {
          filter = term.replace('is:', '');
          if(_cachedFilters[filter]) {
            predicate = _cachedFilters[filter];
            addPredicate(predicate, filter);
          } else {
            for(var key in filterTrans) {
              if(filterTrans.hasOwnProperty(key) && !!~filterTrans[key].indexOf(filter)) {
                predicate = key;
                _cachedFilters[filter] = key;
                addPredicate(predicate, filter);
                break;
              }
            }
          }
        } else if(term.indexOf('light:') >= 0 || term.indexOf('level:') >= 0) {
          filter = term.replace('light:', '').replace('level:', '');
          addPredicate("light", filter);
        } else if (!/^\s*$/.test(term)) {
          addPredicate("keyword", term);
        }
      });

      filterFn = function(item) {
        return _.all(filters, function(filter){
          return filterFns[filter.predicate](filter.value, item);
        });
      };

      _.each(dimStoreService.getStores(), function(store) {
        _.each(store.items, function(item) {
          item.visible = (filters.length > 0) ? filterFn(item) : true;
        });
      });

      dimSettingsService.getSetting('hideFilteredItems').then(function(hideFilteredItems) {
        if (hideFilteredItems) {
          dimStoreService.setHeights();
        }
      });
    };

    // Cache for searches against filterTrans. Somewhat noticebly speeds up the lookup on my older Mac, YMMV. Helps
    // make the for(...) loop for filterTrans a little more bearable for the readability tradeoff.
    var _cachedFilters = {};

    /**
     * Filter groups keyed by type check. Key is what the user will search for, e.g.
     * is:complete
     *
     * Value is the checking function
     * @param {String} predicate The predicate - for example, is:arc gets the 'elemental' filter function, with predicate='arc'
     * @param {Object} item The item to test against.
     * @return {Boolean} Returns true for a match, false for a non-match
     */
    var filterFns = {
      'dmg': function(predicate, item) {
        return item.dmg === predicate;
      },
      'type': function(predicate, item) {
        return item.type.toLowerCase() === predicate;
      },
      'tier': function(predicate, item) {
        return item.tier.toLowerCase() === predicate;
      },
      // Incomplete will show items that are not fully leveled.
      'incomplete': function(predicate, item) {
        return item.talentGrid &&
          !item.complete;
      },
      // Complete shows items that are fully leveled.
      'complete': function(predicate, item) {
        return item.complete;
      },
      // Upgraded will show items that have enough XP to unlock all
      // their nodes and only need the nodes to be purchased.
      'upgraded': function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.xpComplete &&
          !item.complete;
      },
      'xpincomplete': function(predicate, item) {
        return item.talentGrid &&
          !item.talentGrid.xpComplete;
      },
      'xpcomplete': function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.xpComplete;
      },
      'ascended': function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.hasAscendNode &&
          item.talentGrid.ascended;
      },
      'unascended': function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.hasAscendNode &&
          !item.talentGrid.ascended;
      },
      'reforgeable': function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.hasReforgeNode;
      },
      'unlocked': function(predicate, item) {
        return item.lockable &&
          !item.locked;
      },
      'locked': function(predicate, item) {
        return item.lockable &&
          item.locked;
      },
      'dupe': function(predicate, item) {
        if (_duplicates === null) {
          _duplicates = _.chain(dimStoreService.getStores())
            .pluck('items')
            .flatten()
            .countBy('hash')
            .value();
        }

        return _duplicates[item.hash] > 1;
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
      'engram': function(predicate, item) {
        return item.isEngram();
      },
      'weaponClass': function(predicate, item) {
        return predicate.toLowerCase().replace(/\s/g, '') == item.weaponClass;
      },
      'keyword': function(predicate, item) {
        return item.name.toLowerCase().indexOf(predicate) >= 0 ||
          // Search perks as well
          (item.talentGrid && _.any(item.talentGrid.nodes, function(node) {
            return node.name.toLowerCase().indexOf(predicate) >= 0;
          }));
      },
      'light': function(predicate, item) {
        if (predicate.length === 0 || item.primStat === undefined) {
          return false;
        }

        var operands = ['<=','>=','=','>','<'];
        var operand = 'none';
        var result = false;

        operands.forEach(function(element) {
          if (predicate.substring(0,element.length) === element) {
            operand = element;
            predicate = predicate.substring(element.length);
            return false;
          } else {
            return true;
          }
        }, this);

        switch (operand) {
          case 'none':
            result = (item.primStat.value == predicate);
            break;
          case '=':
            result = (item.primStat.value == predicate);
            break;
          case '<':
            result = (item.primStat.value < predicate);
            break;
          case '<=':
            result = (item.primStat.value <= predicate);
            break;
          case '>':
            result = (item.primStat.value > predicate);
            break;
          case '>=':
            result = (item.primStat.value >= predicate);
            break;
        }
        return result;
      },
      'year': function(predicate, item) {
        if (predicate === 'year1') {
          return item.year === 1;
        } else if (predicate === 'year2') {
          return item.year === 2;
        } else {
          return false;
        }
      }
    };
  }
})();
