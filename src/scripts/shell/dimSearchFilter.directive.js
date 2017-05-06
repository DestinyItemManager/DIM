import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimSearchService', SearchService)
  .directive('dimSearchFilter', SearchFilter);

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
    sublime: ['sublime'],
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
    vendor: ['fwc', 'do', 'nm', 'speaker', 'variks', 'shipwright', 'vanguard', 'osiris', 'xur', 'shaxx', 'cq', 'eris', 'ev'],
    activity: ['vanilla', 'trials', 'ib', 'qw', 'cd', 'srl', 'vog', 'ce', 'ttk', 'kf', 'roi', 'wotm', 'poe', 'coe', 'af', 'dawning'],
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
  const comparisons = [":<", ":>", ":<=", ":>=", ":"];

  const stats = ['rof', 'impact', 'range', 'stability', 'reload', 'magazine', 'aimassist', 'equipspeed'];
  stats.forEach(function(word) {
    const filter = 'stat:' + word;
    comparisons.forEach((comparison) => {
      keywords.push(filter + comparison);
    });
  });

  var ranges = ['light', 'level', 'quality', 'percentage'];
  ranges.forEach(function(range) {
    comparisons.forEach((comparison) => {
      keywords.push(range + comparison);
    });
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


function SearchFilter(dimSearchService) {
  return {
    controller: SearchFilterCtrl,
    controllerAs: 'vm',
    link: function Link(scope, element) {
      element.find('input').textcomplete([
        {
          words: dimSearchService.keywords,
          match: /\b((li|le|qu|pe|is:|not:|tag:|notes:|stat:)\w*)$/,
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
    restrict: 'E',
    template: [
      '<input id="filter-input" class="dim-input" autocomplete="off" autocorrect="off" autocapitalize="off" translate-attr="{ placeholder: \'Header.FilterHelp\' }" type="search" name="filter" ng-model="vm.search.query" ng-model-options="{ debounce: 500 }" ng-trim="true">'
    ].join('')
  };
}


function SearchFilterCtrl($scope, dimStoreService, dimVendorService, dimSearchService) {
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

  $scope.$on('dim-vendors-updated', function() {
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

      if (term.startsWith('is:')) {
        filter = term.replace('is:', '');
        if (_cachedFilters[filter]) {
          predicate = _cachedFilters[filter];
          addPredicate(predicate, filter);
        } else {
          _.find(dimSearchService.filterTrans, (value, key) => {
            if (value.indexOf(filter) >= 0) {
              predicate = key;
              _cachedFilters[filter] = key;
              addPredicate(predicate, filter);
              return true;
            }
            return false;
          });
        }
      } else if (term.startsWith('not:')) {
        filter = term.replace('not:', '');
        if (_cachedFilters[filter]) {
          predicate = _cachedFilters[filter];
          addPredicate(predicate, filter, true);
        } else {
          _.find(dimSearchService.filterTrans, (value, key) => {
            if (value.indexOf(filter) >= 0) {
              predicate = key;
              _cachedFilters[filter] = key;
              addPredicate(predicate, filter, true);
              return true;
            }
            return false;
          });
        }
      } else if (term.startsWith('tag:')) {
        filter = term.replace('tag:', '');
        addPredicate("itemtags", filter);
      } else if (term.startsWith('notes:')) {
        filter = term.replace('notes:', '');
        addPredicate("notes", filter);
      } else if (term.startsWith('light:') || term.startsWith('level:')) {
        filter = term.replace('light:', '').replace('level:', '');
        addPredicate("light", filter);
      } else if (term.startsWith('quality:') || term.startsWith('percentage:')) {
        filter = term.replace('quality:', '').replace('percentage:', '');
        addPredicate("quality", filter);
      } else if (term.startsWith('stat:')) {
        // Avoid console.error by checking if all parameters are typed
        var pieces = term.split(':');
        if (pieces.length === 3) {
          filter = pieces[1];
          addPredicate(filter, pieces[2]);
        }
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
    });


    // Filter vendor items
    _.each(dimVendorService.vendors, function(vendor) {
      _.each(vendor.allItems, function(saleItem) {
        saleItem.item.visible = (filters.length > 0) ? filterFn(saleItem.item) : true;
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
    sublime: function(predicate, item) {
      var sublimeEngrams = [
        1986458096, // -gauntlet
        2218811091,
        2672986950, // -body-armor
        779347563,
        3497374572, // -class-item
        808079385,
        3592189221, // -leg-armor
        738642122,
        3797169075, // -helmet
        838904328
      ];
      return sublimeEngrams.includes(item.hash);
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
      return item.talentGrid && _.any(item.talentGrid.nodes, { hash: 617082448 });
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
      return (item.lockable &&
        !item.locked) || !item.lockable;
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
    //   * Eververse (ev)
    vendor: function(predicate, item) {
      var vendorHashes = {         // identifier
        fwc: 995344558,            // SOURCE_VENDOR_FUTURE_WAR_CULT
        do: 103311758,             // SOURCE_VENDOR_DEAD_ORBIT
        nm: 3072854931,            // SOURCE_VENDOR_NEW_MONARCHY
        speaker: 4241664776,       // SOURCE_VENDOR_SPEAKER
        variks: 512830513,         // SOURCE_VENDOR_FALLEN
        shipwright: 3721473564,    // SOURCE_VENDOR_SHIPWRIGHT
        vanguard: 1482793537,      // SOURCE_VENDOR_VANGUARD
        osiris: 3378481830,        // SOURCE_VENDOR_OSIRIS
        xur: 2179714245,           // SOURCE_VENDOR_BLACK_MARKET
        shaxx: 4134961255,         // SOURCE_VENDOR_CRUCIBLE_HANDLER
        cq: 1362425043,            // SOURCE_VENDOR_CRUCIBLE_QUARTERMASTER
        eris: 1374970038,          // SOURCE_VENDOR_CROTAS_BANE
        ev: 3559790162             // SOURCE_VENDOR_SPECIAL_ORDERS
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
      var activityHashes = { // identifier
        trials: 2650556703,  // SOURCE_TRIALS_OF_OSIRIS
        ib: 1322283879,      // SOURCE_IRON_BANNER
        qw: 1983234046,      // SOURCE_QUEENS_EMISSARY_QUEST
        cd: 2775576620,      // SOURCE_CRIMSON_DOUBLES
        srl: 1234918199,     // SOURCE_SRL
        vog: 440710167,      // SOURCE_VAULT_OF_GLASS
        ce: 2585003248,      // SOURCE_CROTAS_END
        ttk: 2659839637,     // SOURCE_TTK
        kf: 1662673928,      // SOURCE_KINGS_FALL
        roi: 2964550958,     // SOURCE_RISE_OF_IRON
        wotm: 4160622434,    // SOURCE_WRATH_OF_THE_MACHINE
        poe: 2784812137,     // SOURCE_PRISON_ELDERS
        coe: 1537575125,     // SOURCE_POE_ELDER_CHALLENGE
        af: 3667653533,      // SOURCE_ARCHON_FORGE
        dawning: 3131490494  // SOURCE_DAWNING
      };
      if (!item) {
        return false;
      }
      if (predicate === "vanilla") {
        return item.year === 1;
      } else {
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
    },
    rof: function(predicate, item) {
      return filterByStats(predicate, item, 'rof');
    },
    impact: function(predicate, item) {
      return filterByStats(predicate, item, 'impact');
    },
    range: function(predicate, item) {
      return filterByStats(predicate, item, 'range');
    },
    stability: function(predicate, item) {
      return filterByStats(predicate, item, 'stability');
    },
    reload: function(predicate, item) {
      return filterByStats(predicate, item, 'reload');
    },
    magazine: function(predicate, item) {
      return filterByStats(predicate, item, 'magazine');
    },
    aimassist: function(predicate, item) {
      return filterByStats(predicate, item, 'aimassist');
    },
    equipspeed: function(predicate, item) {
      return filterByStats(predicate, item, 'equipspeed');
    }
  };

  // This refactored method filters items by stats
  //   * statType = [aa|impact|range|stability|rof|reload|magazine|equipspeed]
  var filterByStats = function(predicate, item, statType) {
    if (predicate.length === 0 || item.stats === undefined) {
      return false;
    }

    var foundStatHash;
    var operands = ['<=', '>=', '=', '>', '<'];
    var operand = 'none';
    var result = false;
    var statHash = {};

    operands.forEach(function(element) {
      if (predicate.substring(0, element.length) === element) {
        operand = element;
        predicate = predicate.substring(element.length);
        return false;
      } else {
        return true;
      }
    }, this);

    statHash = {
      impact: 4043523819,
      range: 1240592695,
      stability: 155624089,
      rof: 4284893193,
      reload: 4188031367,
      magazine: 387123106,
      aimassist: 1345609583,
      equipspeed: 943549884
    }[statType];

    foundStatHash = _.find(item.stats, { statHash });

    if (typeof foundStatHash === 'undefined') {
      return false;
    }

    predicate = parseInt(predicate, 10);

    switch (operand) {
    case 'none':
      result = (foundStatHash.value === predicate);
      break;
    case '=':
      result = (foundStatHash.value === predicate);
      break;
    case '<':
      result = (foundStatHash.value < predicate);
      break;
    case '<=':
      result = (foundStatHash.value <= predicate);
      break;
    case '>':
      result = (foundStatHash.value > predicate);
      break;
    case '>=':
      result = (foundStatHash.value >= predicate);
      break;
    }
    return result;
  };
}
