(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimSearchService', function(dimSettingsService) {
      const categoryFilters = {
        pulserifle: ['CATEGORY_PULSE_RIFLE'],
        scoutrifle: ['CATEGORY_SCOUT_RIFLE'],
        handcannon: ['CATEGORY_HAND_CANNON'],
        autorifle: ['CATEGORY_AUTO_RIFLE'],
        primaryweaponengram: ['CATEGORY_PRIMARY_WEAPON', 'CATEGORY_ENGRAM'],
        sniperrifle: ['CATEGORY_SNIPER_RIFLE'],
        shotgun: ['CATEGORY_SHOTGUN'],
        fusionrifle: ['CATEGORY_FUSION_RIFLE'],
        specialweaponengram: ['CATEGORY_SPECIAL_WEAPON', 'CATEGORY_ENGRAM'],
        rocketlauncher: ['CATEGORY_ROCKET_LAUNCHER'],
        machinegun: ['CATEGORY_MACHINE_GUN'],
        heavyweaponengram: ['CATEGORY_HEAVY_WEAPON', 'CATEGORY_ENGRAM'],
        sidearm: ['CATEGORY_SIDEARM'],
        sword: ['CATEGORY_SWORD']
      };

      /**
       * Filter translation sets. Left-hand is the filter to run from filterFns, right side are possible filterResult
       * values that will set the left-hand to the "match."
       */
      var filterTrans = {
        dmg: ['arc', 'solar', 'void', 'kinetic'],
        type: ['primary', 'special', 'heavy', 'helmet', 'leg', 'gauntlets', 'chest', 'class', 'classitem', 'artifact', 'ghost', 'horn', 'consumable', 'ship', 'material', 'vehicle', 'emblem', 'bounties', 'quests', 'messages', 'missions', 'emote'],
        tier: ['common', 'uncommon', 'rare', 'legendary', 'exotic', 'white', 'green', 'blue', 'purple', 'yellow'],
        incomplete: ['incomplete'],
        complete: ['complete'],
        xpcomplete: ['xpcomplete'],
        xpincomplete: ['xpincomplete', 'needsxp'],
        upgraded: ['upgraded'],
        classType: ['titan', 'hunter', 'warlock'],
        dupe: ['dupe', 'duplicate'],
        unascended: ['unascended', 'unassended', 'unasscended'],
        ascended: ['ascended', 'assended', 'asscended'],
        reforgeable: ['reforgeable', 'reforge', 'rerollable', 'reroll'],
        tracked: ['tracked'],
        untracked: ['untracked'],
        locked: ['locked'],
        unlocked: ['unlocked'],
        stackable: ['stackable'],
        engram: ['engram'],
        category: _.keys(categoryFilters),
        infusable: ['infusable', 'infuse'],
        stattype: ['intellect', 'discipline', 'strength'],
        new: ['new'],
        glimmer: ['glimmeritem', 'glimmerboost', 'glimmersupply'],
        itemtags: _.compact(dimSettingsService.itemTags.map(function(tag) {
          return tag.type;
        }))
      };

      var keywords = _.flatten(_.flatten(_.values(filterTrans)).map(function(word) {
        return ["is:" + word, "not:" + word];
      }));

      // Filters that operate on ranges (>, <, >=, <=)
      var ranges = ['light', 'level', 'quality', 'percentage'];
      ranges.forEach(function(range) {
        keywords.push(range + ":<", range + ":>", range + ":<=", range + ":>=");
      });

      return {
        query: '',
        filterTrans: filterTrans,
        keywords: keywords,
        categoryFilters: categoryFilters
      };
    })
    .directive('dimSearchFilter', SearchFilter);

  SearchFilter.$inject = ['dimSearchService'];

  function SearchFilter(dimSearchService) {
    return {
      controller: SearchFilterCtrl,
      controllerAs: 'vm',
      link: function Link(scope, element) {
        element.find('input').textcomplete([
          {
            words: dimSearchService.keywords,
            match: /\b((li|le|qu|pe|is:|not:)\w*)$/,
            search: function(term, callback) {
              callback($.map(this.words, function(word) {
                return word.indexOf(term) === 0 ? word : null;
              }));
            },
            index: 1,
            replace: function(word) {
              return (word.indexOf('is:') === 0 && word.indexOf('not:') === 0)
                ? (word + ' ') : word;
            }
          }
        ], {
          zIndex: 1000
        });
      },
      bindToController: true,
      restrict: 'A',
      template: [
        '<input id="filter-input" placeholder="{{\'filter_help\' | translate}}" type="search" name="filter" ng-model="vm.search.query" ng-model-options="{ debounce: 500 }" ng-trim="true">'
      ].join('')
    };
  }

  SearchFilterCtrl.$inject = ['$scope', 'dimStoreService', 'dimSearchService'];

  function SearchFilterCtrl($scope, dimStoreService, dimSearchService) {
    var vm = this;
    var filterInputSelector = '#filter-input';
    var _duplicates = null; // Holds a map from item hash to count of occurrances of that hash

    vm.search = dimSearchService;

    $scope.$watch('vm.search.query', function() {
      vm.filter();
    });

    $scope.$on('dim-stores-updated', function() {
      _duplicates = null;
      vm.filter();
    });

    // Something has changed that could invalidate filters
    $scope.$on('dim-filter-invalidate', function() {
      _duplicates = null;
      vm.filter();
    });

    $scope.$on('dim-focus-filter-input', function() {
      vm.focusFilterInput();
    });

    $scope.$on('dim-escape-filter-input', function() {
      vm.blurFilterInputIfEmpty();
      vm.clearFilter();
    });

    $scope.$on('dim-clear-filter-input', function() {
      vm.clearFilter();
    });

    vm.blurFilterInputIfEmpty = function() {
      if (vm.search.query === "") {
        vm.blurFilterInput();
      }
    };

    vm.focusFilterInput = function() {
      $(filterInputSelector).focus();
    };

    vm.blurFilterInput = function() {
      $(filterInputSelector).blur();
    };

    vm.clearFilter = function() {
      vm.search.query = "";
      vm.filter();
    };

    vm.filter = function() {
      var filterValue = (vm.search.query) ? vm.search.query.toLowerCase() : '';
      filterValue = filterValue.replace(/\s+and\s+/, ' ');
      var searchTerms = filterValue.split(/\s+/);
      var filter;
      var predicate = '';
      var filterFn;
      var filters = [];

      function addPredicate(predicate, filter, invert = false) {
        filters.push({ predicate: predicate, value: filter, invert: invert });
      }

      _.each(searchTerms, function(term) {
        if (term.indexOf('is:') >= 0) {
          filter = term.replace('is:', '');
          if (_cachedFilters[filter]) {
            predicate = _cachedFilters[filter];
            addPredicate(predicate, filter);
          } else {
            for (const key in dimSearchService.filterTrans) {
              if (dimSearchService.filterTrans.hasOwnProperty(key) && dimSearchService.filterTrans[key].indexOf(filter) > -1) {
                predicate = key;
                _cachedFilters[filter] = key;
                addPredicate(predicate, filter);
                break;
              }
            }
          }
        } else if (term.indexOf('not:') >= 0) {
          filter = term.replace('not:', '');
          if (_cachedFilters[filter]) {
            predicate = _cachedFilters[filter];
            addPredicate(predicate, filter, true);
          } else {
            for (const key in dimSearchService.filterTrans) {
              if (dimSearchService.filterTrans.hasOwnProperty(key) && dimSearchService.filterTrans[key].indexOf(filter) > -1) {
                predicate = key;
                _cachedFilters[filter] = key;
                addPredicate(predicate, filter, true);
                break;
              }
            }
          }
        } else if (term.indexOf('light:') >= 0 || term.indexOf('level:') >= 0) {
          filter = term.replace('light:', '').replace('level:', '');
          addPredicate("light", filter);
        } else if (term.indexOf('quality:') >= 0 || term.indexOf('percentage:') >= 0) {
          filter = term.replace('quality:', '').replace('percentage:', '');
          addPredicate("quality", filter);
        } else if (!/^\s*$/.test(term)) {
          addPredicate("keyword", term);
        }
      });

      filterFn = function(item) {
        return _.all(filters, function(filter) {
          var result = filterFns[filter.predicate](filter.value, item);
          return filter.invert ? !result : result;
        });
      };

      _.each(dimStoreService.getStores(), function(store) {
        _.each(store.items, function(item) {
          item.visible = (filters.length > 0) ? filterFn(item) : true;
        });

        // Filter vendor items
        _.each(store.vendors, function(vendor) {
          _.each(vendor.items.armor, function(item) {
            item.visible = (filters.length > 0) ? filterFn(item) : true;
          });
          _.each(vendor.items.weapons, function(item) {
            item.visible = (filters.length > 0) ? filterFn(item) : true;
          });
        });
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
      dmg: function(predicate, item) {
        return item.dmg === predicate;
      },
      type: function(predicate, item) {
        return item.type.toLowerCase() === predicate;
      },
      tier: function(predicate, item) {
        const tierMap = {
          white: 'common',
          green: 'uncommon',
          blue: 'rare',
          purple: 'legendary',
          yellow: 'exotic'
        };
        return item.tier.toLowerCase() === (tierMap[predicate] || predicate);
      },
      // Incomplete will show items that are not fully leveled.
      incomplete: function(predicate, item) {
        return item.talentGrid &&
          !item.complete;
      },
      // Complete shows items that are fully leveled.
      complete: function(predicate, item) {
        return item.complete;
      },
      // Upgraded will show items that have enough XP to unlock all
      // their nodes and only need the nodes to be purchased.
      upgraded: function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.xpComplete &&
          !item.complete;
      },
      xpincomplete: function(predicate, item) {
        return item.talentGrid &&
          !item.talentGrid.xpComplete;
      },
      xpcomplete: function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.xpComplete;
      },
      ascended: function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.hasAscendNode &&
          item.talentGrid.ascended;
      },
      unascended: function(predicate, item) {
        return item.talentGrid &&
          item.talentGrid.hasAscendNode &&
          !item.talentGrid.ascended;
      },
      reforgeable: function(predicate, item) {
        return item.talentGrid && _.any(item.talentGrid.nodes, { name: 'Reforge Ready' });
      },
      untracked: function(predicate, item) {
        return item.trackable &&
          !item.tracked;
      },
      tracked: function(predicate, item) {
        return item.trackable &&
          item.tracked;
      },
      unlocked: function(predicate, item) {
        return item.lockable &&
          !item.locked;
      },
      locked: function(predicate, item) {
        return item.lockable &&
          item.locked;
      },
      dupe: function(predicate, item) {
        if (_duplicates === null) {
          _duplicates = _.chain(dimStoreService.getStores())
            .pluck('items')
            .flatten()
            .countBy('hash')
            .value();
        }

        return _duplicates[item.hash] > 1;
      },
      classType: function(predicate, item) {
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

        return (item.classType === value);
      },
      glimmer: function(predicate, item) {
        var boosts = [
          1043138475, // -black-wax-idol
          1772853454, // -blue-polyphage
          3783295803, // -ether-seeds
          3446457162  // -resupply-codes
        ];
        var supplies = [
          269776572, // -house-banners
          3632619276, // -silken-codex
          2904517731, // -axiomatic-beads
          1932910919 // -network-keys
        ];

        switch (predicate) {
        case 'glimmerboost':
          return boosts.includes(item.hash);
        case 'glimmersupply':
          return supplies.includes(item.hash);
        case 'glimmeritem':
          return boosts.includes(item.hash) || supplies.includes(item.hash);
        }
        return false;
      },
      itemtags: function(predicate, item) {
        return item.dimInfo && item.dimInfo.tag === predicate;
      },
      stattype: function(predicate, item) {
        return item.stats && _.any(item.stats, function(s) { return s.name.toLowerCase() === predicate && s.value > 0; });
      },
      stackable: function(predicate, item) {
        return item.maxStackSize > 1;
      },
      engram: function(predicate, item) {
        return item.isEngram();
      },
      infusable: function(predicate, item) {
        return item.talentGrid && item.talentGrid.infusable;
      },
      category: function(predicate, item) {
        const categories = dimSearchService.categoryFilters[predicate.toLowerCase().replace(/\s/g, '')];
        return categories && categories.length &&
          _.all(categories, (c) => item.inCategory(c));
      },
      keyword: function(predicate, item) {
        return item.name.toLowerCase().indexOf(predicate) >= 0 ||
          // Search perks as well
          (item.talentGrid && _.any(item.talentGrid.nodes, function(node) {
            // Fixed #798 by searching on the description too.
            return (node.name + ' ' + node.description).toLowerCase().indexOf(predicate) >= 0;
          }));
      },
      light: function(predicate, item) {
        if (predicate.length === 0 || item.primStat === undefined) {
          return false;
        }

        var operands = ['<=', '>=', '=', '>', '<'];
        var operand = 'none';
        var result = false;

        operands.forEach(function(element) {
          if (predicate.substring(0, element.length) === element) {
            operand = element;
            predicate = predicate.substring(element.length);
            return false;
          } else {
            return true;
          }
        }, this);

        predicate = parseInt(predicate, 10);

        switch (operand) {
        case 'none':
          result = (item.primStat.value === predicate);
          break;
        case '=':
          result = (item.primStat.value === predicate);
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
      quality: function(predicate, item) {
        if (predicate.length === 0 || item.quality === undefined || item.quality === null) {
          return false;
        }

        var operands = ['<=', '>=', '=', '>', '<'];
        var operand = 'none';
        var result = false;

        operands.forEach(function(element) {
          if (predicate.substring(0, element.length) === element) {
            operand = element;
            predicate = predicate.substring(element.length);
            return false;
          } else {
            return true;
          }
        }, this);

        predicate = parseInt(predicate, 10);

        switch (operand) {
        case 'none':
          result = (item.quality.min === predicate);
          break;
        case '=':
          result = (item.quality.min === predicate);
          break;
        case '<':
          result = (item.quality.min < predicate);
          break;
        case '<=':
          result = (item.quality.min <= predicate);
          break;
        case '>':
          result = (item.quality.min > predicate);
          break;
        case '>=':
          result = (item.quality.min >= predicate);
          break;
        }
        return result;
      },
      year: function(predicate, item) {
        if (predicate === 'year1') {
          return item.year === 1;
        } else if (predicate === 'year2') {
          return item.year === 2;
        } else {
          return false;
        }
      },
      new: function(predicate, item) {
        return item.isNew;
      }
    };
  }
})();
