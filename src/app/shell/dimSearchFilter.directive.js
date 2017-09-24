import angular from 'angular';
import _ from 'underscore';
import template from './dimSearchFilter.directive.html';
import { flatMap } from '../util';
import Textcomplete from 'textcomplete/lib/textcomplete';
import Textarea from 'textcomplete/lib/textarea';

angular.module('dimApp')
  .factory('dimSearchService', SearchService)
  .directive('dimSearchFilter', SearchFilter);

function SearchService(dimSettingsService) {
  const categoryFilters = {
    pulserifle: ['CATEGORY_PULSE_RIFLE'],
    scoutrifle: ['CATEGORY_SCOUT_RIFLE'],
    handcannon: ['CATEGORY_HAND_CANNON'],
    autorifle: ['CATEGORY_AUTO_RIFLE'],
    sniperrifle: ['CATEGORY_SNIPER_RIFLE'],
    shotgun: ['CATEGORY_SHOTGUN'],
    sidearm: ['CATEGORY_SIDEARM'],
    rocketlauncher: ['CATEGORY_ROCKET_LAUNCHER'],
    fusionrifle: ['CATEGORY_FUSION_RIFLE'],
    sword: ['CATEGORY_SWORD'],
  };

  const itemTypes = ['helmet', 'leg', 'gauntlets', 'chest', 'class', 'classitem', 'artifact', 'ghost', 'consumable', 'ship', 'material', 'vehicle', 'emblem', 'emote'];

  const stats = ['charge', 'impact', 'range', 'stability', 'reload', 'magazine', 'aimassist', 'equipspeed'];

  // don't have access to dimSettingService yet here.
  if (dimSettingsService.destinyVersion === 1) {
    Object.assign(categoryFilters, {
      primaryweaponengram: ['CATEGORY_PRIMARY_WEAPON', 'CATEGORY_ENGRAM'],
      specialweaponengram: ['CATEGORY_SPECIAL_WEAPON', 'CATEGORY_ENGRAM'],
      heavyweaponengram: ['CATEGORY_HEAVY_WEAPON', 'CATEGORY_ENGRAM'],
      machinegun: ['CATEGORY_MACHINE_GUN'],
    });
    itemTypes.push(...['primary', 'special', 'heavy', 'horn', 'bounties', 'quests', 'messages', 'missions']);
    stats.push(...['rof']);
  } else {
    Object.assign(categoryFilters, {
      grenadelauncher: ['CATEGORY_GRENADE_LAUNCHER'],
      submachine: ['CATEGORY_SUBMACHINEGUN'],
    });
    itemTypes.push(...['energy', 'power']);
    stats.push(...['rpm']);
  }

  /**
   * Filter translation sets. Left-hand is the filter to run from filterFns, right side are possible filterResult
   * values that will set the left-hand to the "match."
   */
  const filterTrans = {
    dmg: ['arc', 'solar', 'void', 'kinetic'],
    type: itemTypes,
    tier: ['common', 'uncommon', 'rare', 'legendary', 'exotic', 'white', 'green', 'blue', 'purple', 'yellow'],
    classType: ['titan', 'hunter', 'warlock'],
    dupe: ['dupe', 'duplicate'],
    tracked: ['tracked'],
    untracked: ['untracked'],
    locked: ['locked'],
    unlocked: ['unlocked'],
    stackable: ['stackable'],
    category: _.keys(categoryFilters),
    inloadout: ['inloadout'],
    new: ['new'],
    hasLight: ['light', 'haslight'],
    level: ['level'],
    weapon: ['weapon'],
    armor: ['armor'],
    equipment: ['equipment', 'equippable'],
    postmaster: ['postmaster', 'inpostmaster'],
    equipped: ['equipped'],
    transferable: ['transferable', 'movable'],
    infusable: ['infusable', 'infuse']
  };

  if (dimSettingsService.destinyVersion === 1) {
    Object.assign(filterTrans, {
      sublime: ['sublime'],
      incomplete: ['incomplete'],
      complete: ['complete'],
      xpcomplete: ['xpcomplete'],
      xpincomplete: ['xpincomplete', 'needsxp'],
      upgraded: ['upgraded'],
      unascended: ['unascended', 'unassended', 'unasscended'],
      ascended: ['ascended', 'assended', 'asscended'],
      reforgeable: ['reforgeable', 'reforge', 'rerollable', 'reroll'],
      ornament: ['ornament', 'ornamentmissing', 'ornamentunlocked'],
      engram: ['engram'],
      stattype: ['intellect', 'discipline', 'strength'],
      glimmer: ['glimmeritem', 'glimmerboost', 'glimmersupply'],
      year: ['year1', 'year2', 'year3'],
      vendor: ['fwc', 'do', 'nm', 'speaker', 'variks', 'shipwright', 'vanguard', 'osiris', 'xur', 'shaxx', 'cq', 'eris', 'ev', 'gunsmith'],
      activity: ['vanilla', 'trials', 'ib', 'qw', 'cd', 'srl', 'vog', 'ce', 'ttk', 'kf', 'roi', 'wotm', 'poe', 'coe', 'af', 'dawning', 'aot'],
      cosmetic: ['cosmetic']
    });
  } else {
    Object.assign(filterTrans, {
      powermod: ['powermod', 'haspowermod']
    });
  }

  if ($featureFlags.reviewsEnabled) {
    filterTrans.hasRating = ['rated', 'hasrating'];
  }

  const keywords = _.flatten(_.flatten(_.values(filterTrans)).map((word) => {
    return [`is:${word}`, `not:${word}`];
  }));

  if ($featureFlags.tagsEnabled) {
    dimSettingsService.itemTags.forEach((tag) => {
      if (tag.type) {
        keywords.push(`tag:${tag.type}`);
      } else {
        keywords.push("tag:none");
      }
    });
  }

  // Filters that operate on ranges (>, <, >=, <=)
  const comparisons = [":<", ":>", ":<=", ":>=", ":"];

  stats.forEach((word) => {
    const filter = `stat:${word}`;
    comparisons.forEach((comparison) => {
      keywords.push(filter + comparison);
    });
  });

  const ranges = ['light', 'level', 'quality', 'percentage'];

  if ($featureFlags.reviewsEnabled) {
    ranges.push('rating');
    ranges.push('ratingcount');
  }

  ranges.forEach((range) => {
    comparisons.forEach((comparison) => {
      keywords.push(range + comparison);
    });
  });

  // free form notes on items
  if ($featureFlags.tagsEnabled) {
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
    link: function link(scope, element) {
      const editor = new Textarea(element[0].getElementsByTagName('input')[0]);
      const textcomplete = new Textcomplete(editor);
      textcomplete.register([
        {
          words: dimSearchService.keywords,
          match: /\b((li|le|qu|pe|ra|is:|not:|tag:|notes:|stat:)\w*)$/i,
          search: function(term, callback) {
            callback(this.words.filter((word) => word.startsWith(term.toLowerCase())));
          },
          index: 1,
          replace: function(word) {
            word = word.toLowerCase();
            return (word.startsWith('is:') && word.startsWith('not:'))
              ? `${word} ` : word;
          }
        }
      ], {
        zIndex: 1000
      });

      textcomplete.on('rendered', () => {
        if (textcomplete.dropdown.items.length) {
          // Activate the first item by default.
          textcomplete.dropdown.items[0].activate();
        }
      });

      scope.$on('$destroy', () => {
        textcomplete.destroy();
      });
    },
    bindToController: true,
    restrict: 'E',
    scope: {},
    template: template
  };
}


function SearchFilterCtrl($scope, dimSettingsService, dimStoreService, D2StoresService, dimVendorService, dimSearchService, hotkeys, $i18next) {
  const vm = this;

  function getStoreService() {
    return dimSettingsService.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  const filterInputId = 'filter-input';
  let _duplicates = null; // Holds a map from item hash to count of occurrances of that hash

  vm.search = dimSearchService;

  $scope.$watch('vm.search.query', () => {
    vm.filter();
  });

  $scope.$on('dim-stores-updated', () => {
    _duplicates = null;
    vm.filter();
  });

  $scope.$on('d2-stores-updated', () => {
    _duplicates = null;
    vm.filter();
  });

  $scope.$on('dim-vendors-updated', () => {
    _duplicates = null;
    vm.filter();
  });

  // Something has changed that could invalidate filters
  $scope.$on('dim-filter-invalidate', () => {
    _duplicates = null;
    vm.filter();
  });

  hotkeys.bindTo($scope)
    .add({
      combo: ['f'],
      description: $i18next.t('Hotkey.StartSearch'),
      callback: function(event) {
        vm.focusFilterInput();
        event.preventDefault();
        event.stopPropagation();
      }
    })
    .add({
      combo: ['esc'],
      allowIn: ['INPUT'],
      callback: function() {
        vm.blurFilterInputIfEmpty();
        vm.clearFilter();
      }
    });

  $scope.$on('dim-clear-filter-input', () => {
    vm.clearFilter();
  });

  vm.blurFilterInputIfEmpty = function() {
    if (vm.search.query === "") {
      vm.blurFilterInput();
    }
  };

  vm.focusFilterInput = function() {
    document.getElementById(filterInputId).focus();
  };

  vm.blurFilterInput = function() {
    document.getElementById(filterInputId).blur();
  };

  vm.clearFilter = function() {
    vm.search.query = "";
    vm.filter();
  };

  vm.filter = function() {
    let filterValue = (vm.search.query) ? vm.search.query.toLowerCase() : '';
    filterValue = filterValue.replace(/\s+and\s+/, ' ');

    // could probably tidy this regex, just a quick hack to support multi term:
    // [^\s]*"[^"]*" -> match is:"stuff here"
    // [^\s]*'[^']*' -> match is:'stuff here'
    // [^\s"']+' -> match is:stuff
    const searchTerms = filterValue.match(/[^\s]*"[^"]*"|[^\s]*'[^']*'|[^\s"']+/g);
    let filter;
    let predicate = '';
    const filters = [];

    function addPredicate(predicate, filter, invert = false) {
      filters.push({ predicate: predicate, value: filter, invert: invert });
    }

    _.each(searchTerms, (term) => {
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
      } else if (term.startsWith('light:')) {
        filter = term.replace('light:', '');
        addPredicate("light", filter);
      } else if (term.startsWith('level:')) {
        filter = term.replace('level:', '');
        addPredicate("level", filter);
      } else if (term.startsWith('quality:') || term.startsWith('percentage:')) {
        filter = term.replace('quality:', '').replace('percentage:', '');
        addPredicate("quality", filter);
      } else if (term.startsWith('rating:')) {
        filter = term.replace('rating:', '');
        addPredicate("rating", filter);
      } else if (term.startsWith('ratingcount:')) {
        filter = term.replace('ratingcount:', '');
        addPredicate("ratingcount", filter);
      } else if (term.startsWith('stat:')) {
        // Avoid console.error by checking if all parameters are typed
        const pieces = term.split(':');
        if (pieces.length === 3) {
          filter = pieces[1];
          addPredicate(filter, pieces[2]);
        }
      } else if (!/^\s*$/.test(term)) {
        addPredicate("keyword", term);
      }
    });

    const filterFn = function(item) {
      return _.all(filters, (filter) => {
        const result = filterFns[filter.predicate](filter.value, item);
        return filter.invert ? !result : result;
      });
    };

    _.each(getStoreService().getStores(), (store) => {
      _.each(store.items, (item) => {
        item.visible = (filters.length > 0) ? filterFn(item) : true;
      });
    });


    // Filter vendor items
    _.each(dimVendorService.vendors, (vendor) => {
      _.each(vendor.allItems, (saleItem) => {
        saleItem.item.visible = (filters.length > 0) ? filterFn(saleItem.item) : true;
      });
    });
  };

  function compareByOperand(compare = 0, predicate) {
    if (predicate.length === 0) {
      return false;
    }

    const operands = ['<=', '>=', '=', '>', '<'];
    let operand = 'none';

    operands.forEach((element) => {
      if (predicate.substring(0, element.length) === element) {
        operand = element;
        predicate = predicate.substring(element.length);
        return false;
      } else {
        return true;
      }
    }, this);

    predicate = parseFloat(predicate);

    switch (operand) {
    case 'none':
      return compare === predicate;
    case '=':
      return compare === predicate;
    case '<':
      return compare < predicate;
    case '<=':
      return compare <= predicate;
    case '>':
      return compare > predicate;
    case '>=':
      return compare >= predicate;
    }
    return false;
  }

  // Cache for searches against filterTrans. Somewhat noticebly speeds up the lookup on my older Mac, YMMV. Helps
  // make the for(...) loop for filterTrans a little more bearable for the readability tradeoff.
  const _cachedFilters = {};

  /**
   * Filter groups keyed by type check. Key is what the user will search for, e.g.
   * is:complete
   *
   * Value is the checking function
   * @param {String} predicate The predicate - for example, is:arc gets the 'elemental' filter function, with predicate='arc'
   * @param {Object} item The item to test against.
   * @return {Boolean} Returns true for a match, false for a non-match
   */
  const filterFns = {
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
      const sublimeEngrams = [
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
    ornament: function(predicate, item) {
      const complete = item.talentGrid && _.any(item.talentGrid.nodes, { ornament: true });
      const missing = item.talentGrid && _.any(item.talentGrid.nodes, { ornament: false });

      if (predicate === 'ornamentunlocked') {
        return complete;
      } else if (predicate === 'ornamentmissing') {
        return missing;
      } else {
        return complete || missing;
      }
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
        _duplicates = _.countBy(flatMap(getStoreService().getStores(), 'items'), 'hash');
      }

      // We filter out the "Default Shader" because everybody has one per character
      return item.hash !== 4248210736 && _duplicates[item.hash] > 1;
    },
    classType: function(predicate, item) {
      let value;

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
      const boosts = [
        1043138475, // -black-wax-idol
        1772853454, // -blue-polyphage
        3783295803, // -ether-seeds
        3446457162 // -resupply-codes
      ];
      const supplies = [
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
      return item.stats && _.any(item.stats, (s) => { return s.name.toLowerCase() === predicate && s.value > 0; });
    },
    stackable: function(predicate, item) {
      return item.maxStackSize > 1;
    },
    engram: function(predicate, item) {
      return item.isEngram();
    },
    infusable: function(predicate, item) {
      return item.infusable;
    },
    category: function(predicate, item) {
      const categories = dimSearchService.categoryFilters[predicate.toLowerCase().replace(/\s/g, '')];

      if (!categories || !categories.length) {
        return false;
      }
      if (dimSettingsService.destinyVersion === 1) {
        return _.all(categories, (c) => item.inCategory(c));
      }
      return _.any(categories, (c) => item.inCategory(c));
    },
    keyword: function(predicate, item) {
      return item.name.toLowerCase().indexOf(predicate) >= 0 ||
        // Search perks as well
        (item.talentGrid && _.any(item.talentGrid.nodes, (node) => {
          // Fixed #798 by searching on the description too.
          return (`${node.name} ${node.description}`).toLowerCase().indexOf(predicate) >= 0;
        })) ||
        (item.sockets && _.any(item.sockets.sockets, (socket) => {
          return socket.plug && (`${socket.plug.displayProperties.name} ${socket.plug.displayProperties.description}`).toLowerCase().indexOf(predicate) >= 0;
        }));
    },
    light: function(predicate, item) {
      if (!item.primStat) {
        return false;
      }
      return compareByOperand(item.primStat.value, predicate);
    },
    level: function(predicate, item) {
      return compareByOperand(item.equipRequiredLevel, predicate);
    },
    quality: function(predicate, item) {
      if (!item.quality) {
        return false;
      }
      return compareByOperand(item.quality.min, predicate);
    },
    hasRating: function(predicate, item) {
      return predicate.length !== 0 && item.dtrRating;
    },
    rating: function(predicate, item) {
      return compareByOperand(item.dtrRating, predicate);
    },
    ratingcount: function(predicate, item) {
      return compareByOperand(item.dtrRatingCount, predicate);
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
      const vendorHashes = { // identifier
        required: {
          fwc: [995344558], // SOURCE_VENDOR_FUTURE_WAR_CULT
          do: [103311758], // SOURCE_VENDOR_DEAD_ORBIT
          nm: [3072854931], // SOURCE_VENDOR_NEW_MONARCHY
          speaker: [4241664776], // SOURCE_VENDOR_SPEAKER
          variks: [512830513], // SOURCE_VENDOR_FALLEN
          shipwright: [3721473564], // SOURCE_VENDOR_SHIPWRIGHT
          vanguard: [1482793537], // SOURCE_VENDOR_VANGUARD
          osiris: [3378481830], // SOURCE_VENDOR_OSIRIS
          xur: [2179714245], // SOURCE_VENDOR_BLACK_MARKET
          shaxx: [4134961255], // SOURCE_VENDOR_CRUCIBLE_HANDLER
          cq: [1362425043], // SOURCE_VENDOR_CRUCIBLE_QUARTERMASTER
          eris: [1374970038], // SOURCE_VENDOR_CROTAS_BANE
          ev: [3559790162], // SOURCE_VENDOR_SPECIAL_ORDERS
          gunsmith: [353834582] // SOURCE_VENDOR_GUNSMITH
        },
        restricted: {
          fwc: [353834582], // remove motes of light & strange coins
          do: [353834582],
          nm: [353834582],
          speaker: [353834582],
          cq: [353834582, 2682516238] // remove ammo synths and planetary materials
        }
      };
      if (!item) {
        return false;
      }
      if (vendorHashes.restricted[predicate]) {
        return (vendorHashes.required[predicate].some((vendorHash) => item.sourceHashes.includes(vendorHash)) &&
              !(vendorHashes.restricted[predicate].some((vendorHash) => item.sourceHashes.includes(vendorHash))));
      } else {
        return (vendorHashes.required[predicate].some((vendorHash) => item.sourceHashes.includes(vendorHash)));
      }
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
      const activityHashes = { // identifier
        required: {
          trials: [2650556703], // SOURCE_TRIALS_OF_OSIRIS
          ib: [1322283879], // SOURCE_IRON_BANNER
          qw: [1983234046], // SOURCE_QUEENS_EMISSARY_QUEST
          cd: [2775576620], // SOURCE_CRIMSON_DOUBLES
          srl: [1234918199], // SOURCE_SRL
          vog: [440710167], // SOURCE_VAULT_OF_GLASS
          ce: [2585003248], // SOURCE_CROTAS_END
          ttk: [2659839637], // SOURCE_TTK
          kf: [1662673928], // SOURCE_KINGS_FALL
          roi: [2964550958], // SOURCE_RISE_OF_IRON
          wotm: [4160622434], // SOURCE_WRATH_OF_THE_MACHINE
          poe: [2784812137], // SOURCE_PRISON_ELDERS
          coe: [1537575125], // SOURCE_POE_ELDER_CHALLENGE
          af: [3667653533], // SOURCE_ARCHON_FORGE
          dawning: [3131490494], // SOURCE_DAWNING
          aot: [3068521220, 4161861381, 440710167] // SOURCE_AGES_OF_TRIUMPH && SOURCE_RAID_REPRISE
        },
        restricted: {
          trials: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
          ib: [3602080346], // remove engrams and random blue drops (Strike)
          qw: [3602080346], // remove engrams and random blue drops (Strike)
          cd: [3602080346], // remove engrams and random blue drops (Strike)
          kf: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
          wotm: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
          poe: [3602080346, 2682516238], // remove engrams
          coe: [3602080346, 2682516238], // remove engrams
          af: [2682516238], // remove engrams
          dawning: [2682516238, 1111209135], // remove engrams, planetary materials, & chroma
          aot: [2964550958, 2659839637, 353834582, 560942287] // Remove ROI, TTK, motes, & glimmer items
        }
      };
      if (!item) {
        return false;
      }
      if (predicate === "vanilla") {
        return item.year === 1;
      } else if (activityHashes.restricted[predicate]) {
        return (activityHashes.required[predicate].some((sourceHash) => item.sourceHashes.includes(sourceHash)) &&
              !(activityHashes.restricted[predicate].some((sourceHash) => item.sourceHashes.includes(sourceHash))));
      } else {
        return (activityHashes.required[predicate].some((sourceHash) => item.sourceHashes.includes(sourceHash)));
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
    powermod: function(predicate, item) {
      return item.primStat && (item.primStat.value !== item.basePower);
    },
    rpm: function(predicate, item) {
      return filterByStats(predicate, item, 'rpm');
    },
    charge: function(predicate, item) {
      return filterByStats(predicate, item, 'charge');
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
  const filterByStats = function(predicate, item, statType) {
    if (predicate.length === 0 || !item.stats) {
      return false;
    }

    const operands = ['<=', '>=', '=', '>', '<'];
    let operand = 'none';
    let result = false;
    let statHash = {};

    operands.forEach((element) => {
      if (predicate.substring(0, element.length) === element) {
        operand = element;
        predicate = predicate.substring(element.length);
        return false;
      } else {
        return true;
      }
    }, this);

    statHash = {
      rpm: 4284893193,
      charge: 2961396640,
      impact: 4043523819,
      range: 1240592695,
      stability: 155624089,
      rof: 4284893193,
      reload: 4188031367,
      magazine: 387123106,
      aimassist: 1345609583,
      equipspeed: 943549884
    }[statType];

    const foundStatHash = _.find(item.stats, { statHash });

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
