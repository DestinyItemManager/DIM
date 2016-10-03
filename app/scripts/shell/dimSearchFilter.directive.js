(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimSearchService', SearchService)
    .directive('dimSearchFilter', SearchFilter);

  SearchService.$inject = ['dimSettingsService', 'dimFeatureFlags'];
  function SearchService(dimSettingsService, dimFeatureFlags) {
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
      inloadout: ['inloadout'],
      new: ['new'],
      glimmer: ['glimmeritem', 'glimmerboost', 'glimmersupply'],
      year: ['year1', 'year2', 'year3'],
      vendor: ['fwc', 'do', 'nm', 'speaker', 'variks', 'shipwright', 'vanguard', 'osiris', 'xur', 'shaxx', 'cq', 'eris'],
      activity: ['vanilla', 'trials', 'ib', 'qw', 'cd', 'srl', 'vog', 'ce', 'ttk', 'kf', 'roi', 'wotm', 'poe', 'coe', 'af'],
      hasLight: ['light', 'haslight'],
      weapon: ['weapon'],
      armor: ['armor'],
      cosmetic: ['cosmetic'],
      equipment: ['equipment', 'equippable'],
      postmaster: ['postmaster', 'inpostmaster'],
      equipped: ['equipped'],
      transferable: ['transferable', 'movable']
    };

    var keywords = _.flatten(_.flatten(_.values(filterTrans)).map(function(word) {
      return ["is:" + word, "not:" + word];
    }));

    if (dimFeatureFlags.tagsEnabled) {
      dimSettingsService.itemTags.forEach(function(tag) {
        if (tag.type) {
          keywords.push("tag:" + tag.type);
        } else {
          keywords.push("tag:none");
        }
      });
    }

    // Filters that operate on ranges (>, <, >=, <=)
    var ranges = ['light', 'level', 'quality', 'percentage'];
    ranges.forEach(function(range) {
      keywords.push(range + ":<", range + ":>", range + ":<=", range + ":>=");
    });

    // free form notes on items
    if (dimFeatureFlags.tagsEnabled) {
      keywords.push('notes:');
    }

    return {
      query: '',
      filterTrans: filterTrans,
      keywords: keywords,
      categoryFilters: categoryFilters
    };
  }

  SearchFilter.$inject = ['dimSearchService'];

  function SearchFilter(dimSearchService) {
    return {
      controller: SearchFilterCtrl,
      controllerAs: 'vm',
      link: function Link(scope, element) {
        element.find('input').textcomplete([
          {
            words: dimSearchService.keywords,
            match: /\b((li|le|qu|pe|is:|not:|tag:|notes:)\w*)$/,
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

      // could probably tidy this regex, just a quick hack to support multi term:
      // [^\s]*"[^"]*" -> match is:"stuff here"
      // [^\s]*'[^']*' -> match is:'stuff here'
      // [^\s"']+' -> match is:stuff
      var searchTerms = filterValue.match(/[^\s]*"[^"]*"|[^\s]*'[^']*'|[^\s"']+/g);
      var filter;
      var predicate = '';
      var filterFn;
      var filters = [];

      function addPredicate(predicate, filter, invert = false) {
        filters.push({ predicate: predicate, value: filter, invert: invert });
      }

      _.each(searchTerms, function(term) {
        term = term.replace(/'/g, '').replace(/"/g, '');

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
        } else if (term.indexOf('tag:') >= 0) {
          filter = term.replace('tag:', '');
          addPredicate("itemtags", filter);
        } else if (term.indexOf('notes:') >= 0) {
          filter = term.replace('notes:', '');
          addPredicate("notes", filter);
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
          _.each(vendor.items, function(items) {
            _.each(items, function(item) {
              item.visible = (filters.length > 0) ? filterFn(item) : true;
            });
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
        return item.type && item.type.toLowerCase() === predicate;
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

        // We filter out the "Default Shader" because everybody has one per character
        return item.hash !== 4248210736 && _duplicates[item.hash] > 1;
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
        return item.dimInfo && (item.dimInfo.tag === predicate || (item.dimInfo.tag === undefined && predicate === 'none'));
      },
      notes: function(predicate, item) {
        return item.dimInfo && item.dimInfo.notes && item.dimInfo.notes.toLocaleLowerCase().includes(predicate.toLocaleLowerCase());
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
        } else if (predicate === 'year3') {
          return item.year === 3;
        } else {
          return false;
        }
      },
      // filter on what vendor an item can come from. Currently supports
      //   * Future War Cult (fwc)
      //   * Dead Orbit (do)
      //   * New Monarchy (nm)
      //   * Speaker (speaker)
      //   * Variks (variks)
      //   * Shipwright (shipwright)
      //   * Osiris: (osiris)
      //   * Xur: (xur)
      //   * Shaxx: (shaxx)
      //   * Crucible Quartermaster (cq)
      //   * Eris Morn (eris)
      vendor: function(predicate, item) {
        var vendorHashes = {
          fwc: 2859308742,
          do: 3080587303,
          nm: 1963381593,
          speaker: 3498761033,
          variks: 3523074641,
          shipwright: 3660582080,
          vanguard: 3496730577,
          osiris: 482203941,
          xur: 941581325,
          shaxx: 1257353826,
          cq: 1587918730,
          eris: 1662396737
        };
        if (!item) {
          return false;
        }
        return (item.sourceHashes.includes(vendorHashes[predicate]));
      },
      // filter on what activity an item can come from. Currently supports
      //   * Vanilla (vanilla)
      //   * Trials (trials)
      //   * Iron Banner (ib)
      //   * Queen's Wrath (qw)
      //   * Crimson Doubles (cd)
      //   * Sparrow Racing League (srl)
      //   * Vault of Glass (vog)
      //   * Crota's End (ce)
      //   * The Taken King (ttk)
      //   * King's Fall (kf)
      //   * Rise of Iron (roi)
      //   * Wrath of the Machine (wotm)
      //   * Prison of Elders (poe)
      //   * Challenge of Elders (coe)
      //   * Archon Forge (af)
      activity: function(predicate, item) {
        var activityHashes = {
          trials: 3413298620,
          ib: 478645002,
          qw: 3286066462,
          cd: 344892955,
          srl: 3945957624,
          vog: 686593720,
          ce: 3107502809,
          ttk: 460228854,
          kf: 3551688287,
          roi: 24296771,
          wotm: 3147905712,
          poe: 36493462,
          coe: 3739898362,
          af: 1389125983
        };
        if (!item) {
          return false;
        }
        if (predicate === "vanilla") {
          return item.year === 1;
        }
        else {
          return (item.sourceHashes.includes(activityHashes[predicate]));
        }
      },
      inloadout: function(predicate, item) {
        return item.isInLoadout;
      },
      new: function(predicate, item) {
        return item.isNew;
      },
      hasLight: function(predicate, item) {
        const lightBuckets = ["BUCKET_CHEST",
                                 "BUCKET_LEGS",
                                 "BUCKET_ARTIFACT",
                                 "BUCKET_HEAVY_WEAPON",
                                 "BUCKET_PRIMARY_WEAPON",
                                 "BUCKET_CLASS_ITEMS",
                                 "BUCKET_SPECIAL_WEAPON",
                                 "BUCKET_HEAD",
                                 "BUCKET_ARMS",
                                 "BUCKET_GHOST"];
        return item.bucket && _.contains(lightBuckets, item.bucket.id);
      },
      weapon: function(predicate, item) {
        return item.bucket && item.bucket.sort === 'Weapons';
      },
      armor: function(predicate, item) {
        return item.bucket && item.bucket.sort === 'Armor';
      },
      cosmetic: function(predicate, item) {
        const cosmeticBuckets = ["BUCKET_SHADER",
                                 "BUCKET_MODS",
                                 "BUCKET_EMOTES",
                                 "BUCKET_EMBLEM",
                                 "BUCKET_VEHICLE",
                                 "BUCKET_SHIP",
                                 "BUCKET_HORN"];
        return item.bucket && _.contains(cosmeticBuckets, item.bucket.id);
      },
      equipment: function(predicate, item) {
        return item.equipment;
      },
      postmaster: function(predicate, item) {
        return item.location && item.location.inPostmaster;
      },
      equipped: function(predicate, item) {
        return item.equipped;
      },
      transferable: function(predicate, item) {
        return !item.notransfer;
      }
    };
  }
})();
