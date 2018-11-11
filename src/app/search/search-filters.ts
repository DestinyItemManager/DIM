import * as _ from 'lodash';

import { compareBy, chainComparator, reverseComparator } from '../comparators';
import { DimItem, D1Item, D2Item } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { Loadout, dimLoadoutService } from '../loadout/loadout.service';
import { DestinyAmmunitionType } from 'bungie-api-ts/destiny2';
import { createSelector } from 'reselect';
import { destinyVersionSelector } from '../accounts/reducer';
import { D1Categories } from '../destiny1/d1-buckets.service';
import { D2Categories } from '../destiny2/d2-buckets.service';
import { querySelector } from '../shell/reducer';
import { storesSelector } from '../inventory/reducer';
import { maxLightLoadout } from '../loadout/auto-loadouts';
import { itemTags } from '../inventory/dim-item-info';
import { characterSortSelector } from '../settings/character-sort';
import store from '../store/store';
import { loadoutsSelector } from '../loadout/reducer';

export const searchConfigSelector = createSelector(
  destinyVersionSelector,
  buildSearchConfig
);

/**
 * A selector for the search config for a particular destiny version.
 */
export const searchFiltersConfigSelector = createSelector(
  searchConfigSelector,
  storesSelector,
  loadoutsSelector,
  (searchConfig, stores, loadouts) => {
    return searchFilters(searchConfig, stores, loadouts);
  }
);

/**
 * A selector for a predicate function for searching items, given the current search query.
 */
// TODO: this also needs to depend on:
// * settings
// * loadouts
// * current character
// * all items (for dupes)
// * itemInfo
// * ratings
// * newItems
// * and maybe some other stuff?
export const searchFilterSelector = createSelector(
  querySelector,
  searchFiltersConfigSelector,
  (query, filters) => filters.filterFunction(query)
);

export interface SearchConfig {
  destinyVersion: 1 | 2;
  keywords: string[];
  categoryHashFilters: { [key: string]: number };
  keywordToFilter: { [key: string]: string };
}

/**
 * Builds an object that describes the available search keywords and category mappings.
 */
export function buildSearchConfig(destinyVersion: 1 | 2): SearchConfig {
  const categories = destinyVersion === 1 ? D1Categories : D2Categories;
  const itemTypes = _.flatMap(Object.values(categories), (l: string[]) =>
    l.map((v) => v.toLowerCase())
  );

  // Add new ItemCategoryHash hashes to this (or down below in the D2 area) to add new category searches
  let categoryHashFilters: { [key: string]: number } = {
    autorifle: 5,
    handcannon: 6,
    pulserifle: 7,
    scoutrifle: 8,
    fusionrifle: 9,
    sniperrifle: 10,
    shotgun: 11,
    machinegun: 12,
    rocketlauncher: 13,
    sidearm: 14,
    sword: 54
  };

  const stats = [
    'charge',
    'impact',
    'range',
    'stability',
    'reload',
    'magazine',
    'aimassist',
    'equipspeed'
  ];

  if (destinyVersion === 1) {
    stats.push('rof');
  } else {
    categoryHashFilters = {
      ...categoryHashFilters,
      grenadelauncher: 153950757,
      tracerifle: 2489664120,
      linearfusionrifle: 1504945536,
      submachine: 3954685534,
      bow: 3317538576,
      transmat: 208981632,
      weaponmod: 610365472,
      armormod: 4104513227,
      reptoken: 2088636411
    };
    stats.push('rpm', 'mobility', 'recovery', 'resilience');
  }

  /**
   * Filter translation sets. Left-hand is the filter to run from filterFns, right side are possible filterResult
   * values that will set the left-hand to the "match."
   */
  const filterTrans: {
    [key: string]: string[];
  } = {
    dmg: ['arc', 'solar', 'void', 'kinetic', 'heroic'],
    type: itemTypes,
    tier: [
      'common',
      'uncommon',
      'rare',
      'legendary',
      'exotic',
      'white',
      'green',
      'blue',
      'purple',
      'yellow'
    ],
    classType: ['titan', 'hunter', 'warlock'],
    dupe: ['dupe', 'duplicate', 'dupelower'],
    locked: ['locked'],
    unlocked: ['unlocked'],
    stackable: ['stackable'],
    weapon: ['weapon'],
    armor: ['armor'],
    categoryHash: Object.keys(categoryHashFilters),
    inloadout: ['inloadout'],
    maxpower: ['maxpower'],
    new: ['new'],
    tag: ['tagged'],
    level: ['level'],
    equipment: ['equipment', 'equippable'],
    postmaster: ['postmaster', 'inpostmaster'],
    equipped: ['equipped'],
    transferable: ['transferable', 'movable'],
    infusable: ['infusable', 'infuse'],
    owner: ['invault', 'incurrentchar'],
    location: ['inleftchar', 'inmiddlechar', 'inrightchar'],
    cosmetic: ['cosmetic']
  };

  if (destinyVersion === 1) {
    Object.assign(filterTrans, {
      hasLight: ['light', 'haslight'],
      tracked: ['tracked'],
      untracked: ['untracked'],
      sublime: ['sublime'],
      incomplete: ['incomplete'],
      complete: ['complete'],
      xpcomplete: ['xpcomplete'],
      xpincomplete: ['xpincomplete', 'needsxp'],
      upgraded: ['upgraded'],
      unascended: ['unascended', 'unassended', 'unasscended'],
      ascended: ['ascended', 'assended', 'asscended'],
      reforgeable: ['reforgeable', 'reforge', 'rerollable', 'reroll'],
      ornament: ['ornamentable', 'ornamentmissing', 'ornamentunlocked'],
      engram: ['engram'],
      stattype: ['intellect', 'discipline', 'strength'],
      glimmer: ['glimmeritem', 'glimmerboost', 'glimmersupply'],
      year: ['year1', 'year2', 'year3'],
      vendor: [
        'fwc',
        'do',
        'nm',
        'speaker',
        'variks',
        'shipwright',
        'vanguard',
        'osiris',
        'xur',
        'shaxx',
        'cq',
        'eris',
        'ev',
        'gunsmith'
      ],
      activity: [
        'vanilla',
        'trials',
        'ib',
        'qw',
        'cd',
        'srl',
        'vog',
        'ce',
        'ttk',
        'kf',
        'roi',
        'wotm',
        'poe',
        'coe',
        'af',
        'dawning',
        'aot'
      ]
    });
  } else {
    Object.assign(filterTrans, {
      hasLight: ['light', 'haslight', 'haspower'],
      complete: ['goldborder', 'yellowborder', 'complete'],
      masterwork: ['masterwork', 'masterworks'],
      hasShader: ['shaded', 'hasshader'],
      hasMod: ['modded', 'hasmod'],
      prophecy: ['prophecy'],
      ikelos: ['ikelos'],
      randomroll: ['randomroll'],
      ammoType: ['special', 'primary', 'heavy'],
      season: ['season1', 'season2', 'season3', 'season4'],
      event: ['dawning', 'crimsondays', 'solstice', 'fotl'],
      year: ['year1', 'year2'],
      source: [
        'edz',
        'titan',
        'nessus',
        'io',
        'mercury',
        'mars',
        'crucible',
        'trials',
        'ironbanner',
        'zavala',
        'ikora',
        'gunsmith',
        'gambit',
        'eververse',
        'nm',
        'do',
        'fwc',
        'leviathan',
        'lastwish',
        'ep'
      ]
    });
  }

  if ($featureFlags.reviewsEnabled) {
    filterTrans.hasRating = ['rated', 'hasrating'];
  }

  const keywords: string[] = _.flatten(
    _.flatten(Object.values(filterTrans)).map((word) => {
      return [`is:${word}`, `not:${word}`];
    })
  );

  itemTags.forEach((tag) => {
    if (tag.type) {
      keywords.push(`tag:${tag.type}`);
    } else {
      keywords.push('tag:none');
    }
  });

  // Filters that operate on ranges (>, <, >=, <=)
  const comparisons = [':<', ':>', ':<=', ':>=', ':='];

  stats.forEach((word) => {
    const filter = `stat:${word}`;
    comparisons.forEach((comparison) => {
      keywords.push(filter + comparison);
    });
  });

  const ranges = ['light', 'power', 'level', 'stack'];
  if (destinyVersion === 1) {
    ranges.push('quality', 'percentage');
  }

  if (destinyVersion === 2) {
    ranges.push('masterwork');
    keywords.push('source:');
  }

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
  keywords.push('notes:');
  keywords.push('perk:');

  // Build an inverse mapping of keyword to function name
  const keywordToFilter: { [key: string]: string } = {};
  _.each(filterTrans, (keywords, functionName) => {
    for (const keyword of keywords) {
      keywordToFilter[keyword] = functionName;
    }
  });

  return {
    keywordToFilter,
    keywords,
    destinyVersion,
    categoryHashFilters
  };
}

// The comparator for sorting dupes - the first item will be the "best" and all others are "dupelower".
const dupeComparator = reverseComparator(
  chainComparator(
    // primary stat
    compareBy((item: DimItem) => item.primStat && item.primStat.value),
    compareBy((item: DimItem) => item.masterwork),
    compareBy((item: DimItem) => item.locked),
    compareBy(
      (item: DimItem) =>
        item.dimInfo && item.dimInfo.tag && ['favorite', 'keep'].includes(item.dimInfo.tag)
    ),
    compareBy((i: DimItem) => i.id) // tiebreak by ID
  )
);

export interface SearchFilters {
  filters: {
    [predicate: string]: (
      item: DimItem,
      predicate?: string
    ) => boolean | '' | null | undefined | false | number;
  };
  filterFunction(query: string): (item: DimItem) => boolean;
}

const alwaysTrue = () => true;

/**
 * This builds an object that can be used to generate filter functions from search queried.
 *
 */
function searchFilters(
  searchConfig: SearchConfig,
  stores: DimStore[],
  loadouts: Loadout[]
): SearchFilters {
  let _duplicates: { [hash: number]: DimItem[] } | null = null; // Holds a map from item hash to count of occurrances of that hash
  const _maxPowerItems: string[] = [];
  const _lowerDupes = {};
  let _sortedStores: DimStore[] | null = null;
  let _loadoutItemIds: Set<string> | undefined;
  const getLoadouts = _.once(() => dimLoadoutService.getLoadouts());

  const statHashes = new Set([
    1480404414, // D2 Attack
    3897883278, // D1 & D2 Defense
    368428387 // D1 Attack
  ]);

  const cosmeticTypes = new Set([
    'Shader',
    'Shaders',
    'Ornaments',
    'Modifications',
    'Emote',
    'Emotes',
    'Emblem',
    'Emblems',
    'Vehicle',
    'Horn',
    'Ship',
    'Ships',
    'ClanBanners'
  ]);

  const D2Sources = {
    edz: 1373723300, // EDZ*
    titan: 3534706087, // Titan (Arcology)*
    nessus: 1906492169, // Nessus*
    io: 315474873, // Io*
    mercury: 3079246067, // Mercury (Lighthouse)*
    mars: 1036506031, // Mars (Cradle)*

    ep: 4137108180, // escalation protocol*

    crucible: 897576623, // Crucible*
    trials: 1607607347, // Trials*
    ironbanner: 3072862693, // Iron Banner*
    zavala: 2527168932, // Zavala*
    ikora: 3075817319, // Ikora*
    gunsmith: 1788267693, // Gunsmith*
    gambit: 2170269026, // Drifter*

    eververse: 4036739795, // Eververse*

    nm: 1464399708, // New Monarchy*
    do: 146504277, // Dead Orbit*
    fwc: 3569603185, // FWC*

    leviathan: 2653618435, // Leviathan*
    lastwish: 2455011338 // Last Wish*
  };

  const prophecyHash = new Set([
    472169727,
    3991544423,
    3285365666,
    161537636,
    2091737595,
    3991544422,
    3285365667,
    161537637,
    3188460622,
    1490571337,
    2248667690, // perfect paradox
    573576346 // sagira shell
  ]);

  const ikelosHash = new Set([847450546, 1723472487, 1887808042, 3866356643, 4036115577]);

  // This refactored method filters items by stats
  //   * statType = [aa|impact|range|stability|rof|reload|magazine|equipspeed|mobility|resilience|recovery]
  const filterByStats = (statType) => {
    const statHash = {
      rpm: 4284893193,
      rof: 4284893193,
      charge: 2961396640,
      impact: 4043523819,
      range: 1240592695,
      stability: 155624089,
      reload: 4188031367,
      magazine: 3871231066,
      aimassist: 1345609583,
      equipspeed: 943549884,
      mobility: 2996146975,
      resilience: 392767087,
      recovery: 1943323491,
      velocity: 2523465841,
      blastradius: 2523465841,
      recoildirection: 2715839340,
      drawtime: 447667954,
      zoom: 3555269338,
      inventorysize: 1931675084
    }[statType];

    return (item: DimItem, predicate: string) => {
      const foundStatHash = item.stats && item.stats.find((s) => s.statHash === statHash);
      return foundStatHash && compareByOperand(foundStatHash.value, predicate);
    };
  };

  function compareByOperand(compare = 0, predicate: string) {
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

    const predicateValue = parseFloat(predicate);

    switch (operand) {
      case 'none':
      case '=':
        return compare === predicateValue;
      case '<':
        return compare < predicateValue;
      case '<=':
        return compare <= predicateValue;
      case '>':
        return compare > predicateValue;
      case '>=':
        return compare >= predicateValue;
    }
    return false;
  }

  // reset, filterFunction, and filters
  return {
    /**
     * Build a complex predicate function from a full query string.
     */
    filterFunction(query: string): (item: DimItem) => boolean {
      if (!query.length) {
        return alwaysTrue;
      }

      query = query
        .trim()
        .toLowerCase()
        .replace(/\s+and\s+/, ' ');

      // could probably tidy this regex, just a quick hack to support multi term:
      // [^\s]*?"[^"]+?" -> match is:"stuff here"
      // [^\s]*?'[^']+?' -> match is:'stuff here'
      // [^\s"']+' -> match is:stuff
      const searchTerms = query.match(/[^\s]*?"[^"]+?"|[^\s]*?'[^']+?'|[^\s"']+/g) || [];
      interface Filter {
        invert: boolean;
        value: string;
        predicate: string;
        orFilters?: Filter[];
      }
      const filters: Filter[] = [];

      // The entire implementation of "or" is a dirty hack - we should really
      // build an expression tree instead. But here, we flip a flag when we see
      // an "or" token, and then on the next filter we instead combine the filter
      // with the previous one in a hacked-up "or" node that we'll handle specially.
      let or = false;

      function addPredicate(predicate: string, filter: string, invert: boolean = false) {
        const filterDef: Filter = { predicate, value: filter, invert };
        if (or && filters.length) {
          const lastFilter = filters.pop();
          filters.push({
            predicate: 'or',
            invert: false,
            value: '',
            orFilters: [...(lastFilter!.orFilters! || [lastFilter])!, filterDef]
          });
        } else {
          filters.push(filterDef);
        }
        or = false;
      }

      for (const search of searchTerms) {
        const invert = search.startsWith('-');
        const term = search.replace(/^-/, '');

        if (term === 'or') {
          or = true;
        } else if (term.startsWith('is:')) {
          const filter = term.replace('is:', '');
          const predicate = searchConfig.keywordToFilter[filter];
          if (predicate) {
            addPredicate(predicate, filter, invert);
          }
        } else if (term.startsWith('not:')) {
          const filter = term.replace('not:', '');
          const predicate = searchConfig.keywordToFilter[filter];
          if (predicate) {
            addPredicate(predicate, filter, !invert);
          }
        } else if (term.startsWith('tag:')) {
          const filter = term.replace('tag:', '');
          addPredicate('itemtags', filter, invert);
        } else if (term.startsWith('notes:')) {
          const filter = term.replace('notes:', '').replace(/(^['"]|['"]$)/g, '');
          addPredicate('notes', filter, invert);
        } else if (term.startsWith('perk:')) {
          const filter = term.replace('perk:', '').replace(/(^['"]|['"]$)/g, '');
          addPredicate('perk', filter, invert);
        } else if (term.startsWith('light:') || term.startsWith('power:')) {
          const filter = term.replace('light:', '').replace('power:', '');
          addPredicate('light', filter, invert);
        } else if (term.startsWith('masterwork:')) {
          const filter = term.replace('masterwork:', '');
          addPredicate('masterworkValue', filter, invert);
        } else if (term.startsWith('stack:')) {
          const filter = term.replace('stack:', '');
          addPredicate('stack', filter, invert);
        } else if (term.startsWith('level:')) {
          const filter = term.replace('level:', '');
          addPredicate('level', filter, invert);
        } else if (term.startsWith('quality:') || term.startsWith('percentage:')) {
          const filter = term.replace('quality:', '').replace('percentage:', '');
          addPredicate('quality', filter, invert);
        } else if (term.startsWith('rating:')) {
          const filter = term.replace('rating:', '');
          addPredicate('rating', filter, invert);
        } else if (term.startsWith('ratingcount:')) {
          const filter = term.replace('ratingcount:', '');
          addPredicate('ratingcount', filter, invert);
        } else if (term.startsWith('stat:')) {
          // Avoid console.error by checking if all parameters are typed
          const pieces = term.split(':');
          if (pieces.length === 3) {
            const filter = pieces[1];
            addPredicate(filter, pieces[2]);
          }
        } else if (term.startsWith('source:')) {
          const filter = term.replace('source:', '');
          addPredicate('source', filter, invert);
        } else if (!/^\s*$/.test(term)) {
          addPredicate('keyword', term.replace(/(^['"]|['"]$)/g, ''), invert);
        }
      }

      _sortedStores = null;

      return (item: DimItem) => {
        return filters.every((filter) => {
          let result;
          if (filter.orFilters) {
            result = filter.orFilters.some((filter) => {
              const result =
                this.filters[filter.predicate] &&
                this.filters[filter.predicate](item, filter.value);

              return filter.invert ? !result : result;
            });
          } else {
            result =
              this.filters[filter.predicate] && this.filters[filter.predicate](item, filter.value);
          }
          return filter.invert ? !result : result;
        });
      };
    },

    /**
     * Each entry in this map is a filter function that will be provided the normalized
     * query term and an item, and should return whether or not it matches the filter.
     * @param predicate The predicate - for example, is:arc gets the 'elemental' filter function, with predicate='arc'
     * @param item The item to test against.
     * @return Returns true for a match, false for a non-match
     */
    filters: {
      dmg(item: DimItem, predicate: string) {
        return item.dmg === predicate;
      },
      type(item: DimItem, predicate: string) {
        return item.type && item.type.toLowerCase() === predicate;
      },
      tier(item: DimItem, predicate: string) {
        const tierMap = {
          white: 'common',
          green: 'uncommon',
          blue: 'rare',
          purple: 'legendary',
          yellow: 'exotic'
        };
        return item.tier.toLowerCase() === (tierMap[predicate] || predicate);
      },
      sublime(item: DimItem) {
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
      incomplete(item: DimItem) {
        return item.talentGrid && !item.complete;
      },
      // Complete shows items that are fully leveled.
      complete(item: DimItem) {
        return item.complete;
      },
      // Upgraded will show items that have enough XP to unlock all
      // their nodes and only need the nodes to be purchased.
      upgraded(item: D1Item) {
        return item.talentGrid && item.talentGrid.xpComplete && !item.complete;
      },
      xpincomplete(item: D1Item) {
        return item.talentGrid && !item.talentGrid.xpComplete;
      },
      xpcomplete(item: D1Item) {
        return item.talentGrid && item.talentGrid.xpComplete;
      },
      ascended(item: D1Item) {
        return item.talentGrid && item.talentGrid.hasAscendNode && item.talentGrid.ascended;
      },
      unascended(item: D1Item) {
        return item.talentGrid && item.talentGrid.hasAscendNode && !item.talentGrid.ascended;
      },
      reforgeable(item: DimItem) {
        return item.talentGrid && item.talentGrid.nodes.some((n) => n.hash === 617082448);
      },
      ornament(item: D1Item, predicate: string) {
        const complete = item.talentGrid && item.talentGrid.nodes.some((n) => n.ornament);
        const missing = item.talentGrid && item.talentGrid.nodes.some((n) => !n.ornament);

        if (predicate === 'ornamentunlocked') {
          return complete;
        } else if (predicate === 'ornamentmissing') {
          return missing;
        } else {
          return complete || missing;
        }
      },
      untracked(item: D1Item) {
        return item.trackable && !item.tracked;
      },
      tracked(item: D1Item) {
        return item.trackable && item.tracked;
      },
      unlocked(item: DimItem) {
        return (item.lockable && !item.locked) || !item.lockable;
      },
      locked(item: DimItem) {
        return item.lockable && item.locked;
      },
      masterwork(item: DimItem) {
        return item.masterwork;
      },
      maxpower(item: DimItem) {
        if (!_maxPowerItems.length) {
          stores.forEach((store) => {
            _maxPowerItems.push(
              ..._.flatten(
                Object.values(maxLightLoadout(store.getStoresService(), store).items)
              ).map((i) => i.id)
            );
          });
        }

        return _maxPowerItems.includes(item.id);
      },
      dupe(item: DimItem, predicate: string) {
        if (_duplicates === null) {
          _duplicates = {};
          for (const store of stores) {
            for (const i of store.items) {
              if (!_duplicates[i.hash]) {
                _duplicates[i.hash] = [];
              }
              _duplicates[i.hash].push(i);
            }
          }

          _.each(_duplicates, (dupes: DimItem[]) => {
            if (dupes.length > 1) {
              dupes.sort(dupeComparator);
              const bestDupe = dupes[0];
              for (const dupe of dupes) {
                if (
                  dupe.bucket &&
                  (dupe.bucket.sort === 'Weapons' || dupe.bucket.sort === 'Armor') &&
                  !dupe.notransfer
                ) {
                  _lowerDupes[dupe.id] = dupe !== bestDupe;
                }
              }
            }
          });
        }

        if (predicate === 'dupelower') {
          return _lowerDupes[item.id];
        }

        // We filter out the "Default Shader" because everybody has one per character
        return (
          item.hash !== 4248210736 && _duplicates[item.hash] && _duplicates[item.hash].length > 1
        );
      },
      owner(item: DimItem, predicate: string) {
        let desiredStore = '';
        switch (predicate) {
          case 'invault':
            desiredStore = 'vault';
            break;
          case 'incurrentchar':
            const activeStore = stores[0].getStoresService().getActiveStore();
            if (activeStore) {
              desiredStore = activeStore.id;
            } else {
              return false;
            }
        }
        return item.owner === desiredStore;
      },
      location(item: DimItem, predicate: string) {
        let storeIndex = 0;
        if (_sortedStores === null) {
          _sortedStores = characterSortSelector(store.getState())(stores);
        }

        switch (predicate) {
          case 'inleftchar':
            storeIndex = 0;
            break;
          case 'inmiddlechar':
            if (_sortedStores.length === 4) {
              storeIndex = 1;
            }
            break;
          case 'inrightchar':
            if (_sortedStores.length > 2) {
              storeIndex = _sortedStores.length - 2;
            }
            break;
          default:
            return false;
        }

        return item.bucket.accountWide
          ? item.owner !== 'vault'
          : item.owner === _sortedStores[storeIndex].id;
      },
      classType(item: DimItem, predicate: string) {
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

        return item.classType === value;
      },
      glimmer(item: DimItem, predicate: string) {
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
      itemtags(item: DimItem, predicate: string) {
        return (
          item.dimInfo &&
          (item.dimInfo.tag === predicate ||
            (item.dimInfo.tag === undefined && predicate === 'none'))
        );
      },
      notes(item: DimItem, predicate: string) {
        return (
          item.dimInfo &&
          item.dimInfo.notes &&
          item.dimInfo.notes.toLocaleLowerCase().includes(predicate.toLocaleLowerCase())
        );
      },
      stattype(item: DimItem, predicate: string) {
        return (
          item.stats &&
          item.stats.some((s) =>
            Boolean(s.name.toLowerCase() === predicate && s.value && s.value > 0)
          )
        );
      },
      stackable(item: DimItem) {
        return item.maxStackSize > 1;
      },
      stack(item: DimItem, predicate: string) {
        return compareByOperand(item.amount, predicate);
      },
      engram(item: DimItem) {
        return item.isEngram;
      },
      infusable(item: DimItem) {
        return item.infusable;
      },
      categoryHash(item: D2Item, predicate: string) {
        const categoryHash =
          searchConfig.categoryHashFilters[predicate.toLowerCase().replace(/\s/g, '')];

        if (!categoryHash) {
          return false;
        }
        return item.itemCategoryHashes.includes(categoryHash);
      },
      keyword(item: DimItem, predicate: string) {
        return (
          item.name.toLowerCase().includes(predicate) ||
          item.description.toLowerCase().includes(predicate) ||
          // Search for typeName (itemTypeDisplayName of modifications)
          item.typeName.toLowerCase().includes(predicate) ||
          // Search perks as well
          this.perk(item, predicate)
        );
      },
      perk(item: DimItem, predicate: string) {
        return (
          (item.talentGrid &&
            item.talentGrid.nodes.some((node) => {
              // Fixed #798 by searching on the description too.
              return (
                node.name.toLowerCase().includes(predicate) ||
                node.description.toLowerCase().includes(predicate)
              );
            })) ||
          (item.isDestiny2() &&
            item.sockets &&
            item.sockets.sockets.some((socket) =>
              socket.plugOptions.some(
                (plug) =>
                  plug.plugItem.displayProperties.name.toLowerCase().includes(predicate) ||
                  plug.plugItem.displayProperties.description.toLowerCase().includes(predicate) ||
                  plug.perks.some((perk) =>
                    Boolean(
                      (perk.displayProperties.name &&
                        perk.displayProperties.name.toLowerCase().includes(predicate)) ||
                        (perk.displayProperties.description &&
                          perk.displayProperties.description.toLowerCase().includes(predicate))
                    )
                  )
              )
            ))
        );
      },
      light(item: DimItem, predicate: string) {
        if (!item.primStat) {
          return false;
        }
        return compareByOperand(item.primStat.value, predicate);
      },
      masterworkValue(item: D2Item, predicate: string) {
        if (!item.masterworkInfo) {
          return false;
        }
        if (item.masterworkInfo.statValue && item.masterworkInfo.statValue < 11) {
          return compareByOperand(item.masterworkInfo.statValue, predicate);
        } else {
          return compareByOperand(10, predicate);
        }
      },
      level(item: DimItem, predicate: string) {
        return compareByOperand(item.equipRequiredLevel, predicate);
      },
      quality(item: D1Item, predicate: string) {
        if (!item.quality) {
          return false;
        }
        return compareByOperand(item.quality.min, predicate);
      },
      hasRating(item: DimItem, predicate: string) {
        return predicate.length !== 0 && item.dtrRating && item.dtrRating.overallScore;
      },
      randomroll(item: D2Item) {
        return item.sockets && item.sockets.sockets.some((s) => s.hasRandomizedPlugItems);
      },
      rating(item: DimItem, predicate: string) {
        return (
          item.dtrRating &&
          item.dtrRating.overallScore &&
          compareByOperand(item.dtrRating.overallScore, predicate)
        );
      },
      ratingcount(item: DimItem, predicate: string) {
        return (
          item.dtrRating &&
          item.dtrRating.ratingCount &&
          compareByOperand(item.dtrRating.ratingCount, predicate)
        );
      },
      year(item: DimItem, predicate: string) {
        if (item.isDestiny1()) {
          switch (predicate) {
            case 'year1':
              return item.year === 1;
            case 'year2':
              return item.year === 2;
            case 'year3':
              return item.year === 3;
            default:
              return false;
          }
        } else if (item.isDestiny2()) {
          switch (predicate) {
            case 'year1':
              return item.season >= 1 && item.season < 4;
            case 'year2':
              return item.season > 3 || !item.season;
            default:
              return false;
          }
        }
      },
      season(item: D2Item, predicate: string) {
        switch (predicate) {
          case 'season1':
            return item.season === 1;
          case 'season2':
            return item.season === 2;
          case 'season3':
            return item.season === 3;
          case 'season4':
            return item.season === 4 || !item.season;
          default:
            return false;
        }
      },
      event(item: D2Item, predicate: string) {
        switch (predicate) {
          case 'dawning':
            return item.event === 1;
          case 'crimsondays':
            return item.event === 2;
          case 'solstice':
            return item.event === 3;
          case 'fotl':
            return item.event === 4;
          default:
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
      vendor(item: D1Item, predicate: string) {
        const vendorHashes = {
          // identifier
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
          return (
            vendorHashes.required[predicate].some((vendorHash) =>
              item.sourceHashes.includes(vendorHash)
            ) &&
            !vendorHashes.restricted[predicate].some((vendorHash) =>
              item.sourceHashes.includes(vendorHash)
            )
          );
        } else {
          return vendorHashes.required[predicate].some((vendorHash) =>
            item.sourceHashes.includes(vendorHash)
          );
        }
      },
      source(item: D2Item, predicate: string) {
        if (!item) {
          return false;
        }
        return item.source === D2Sources[predicate];
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
      activity(item: D1Item, predicate: string) {
        const activityHashes = {
          // identifier
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
        if (predicate === 'vanilla') {
          return item.year === 1;
        } else if (activityHashes.restricted[predicate]) {
          return (
            activityHashes.required[predicate].some((sourceHash) =>
              item.sourceHashes.includes(sourceHash)
            ) &&
            !activityHashes.restricted[predicate].some((sourceHash) =>
              item.sourceHashes.includes(sourceHash)
            )
          );
        } else {
          return activityHashes.required[predicate].some((sourceHash) =>
            item.sourceHashes.includes(sourceHash)
          );
        }
      },
      inloadout(item: DimItem) {
        // Lazy load loadouts and re-trigger
        if (!_loadoutItemIds) {
          if (loadouts.length === 0) {
            getLoadouts();
            return false;
          }
          _loadoutItemIds = new Set<string>();
          for (const loadout of loadouts) {
            if (loadout.destinyVersion === searchConfig.destinyVersion) {
              _.each(loadout.items, (items) => {
                for (const item of items) {
                  _loadoutItemIds!.add(item.id);
                }
              });
            }
          }
        }

        return _loadoutItemIds && _loadoutItemIds.has(item.id);
      },
      new(item: DimItem) {
        // TODO: pass newItems into the filter object too?
        return store.getState().inventory.newItems.has(item.id);
      },
      tag(item: DimItem) {
        return item.dimInfo.tag !== undefined;
      },
      hasLight(item: DimItem) {
        return item.primStat && statHashes.has(item.primStat.statHash);
      },
      weapon(item: DimItem) {
        return item.bucket && item.bucket.sort === 'Weapons';
      },
      armor(item: DimItem) {
        return item.bucket && item.bucket.sort === 'Armor';
      },
      prophecy(item: D2Item) {
        return prophecyHash.has(item.hash);
      },
      ikelos(item: D2Item) {
        return ikelosHash.has(item.hash);
      },
      cosmetic(item: DimItem) {
        return cosmeticTypes.has(item.type);
      },
      equipment(item: DimItem) {
        return item.equipment;
      },
      postmaster(item: DimItem) {
        return item.location && item.location.inPostmaster;
      },
      equipped(item: DimItem) {
        return item.equipped;
      },
      transferable(item: DimItem) {
        return !item.notransfer;
      },
      hasShader(item: D2Item) {
        return (
          item.sockets &&
          item.sockets.sockets.some((socket) => {
            return Boolean(
              socket.plug &&
                socket.plug.plugItem.plug &&
                socket.plug.plugItem.plug.plugCategoryHash === 2973005342 &&
                socket.plug.plugItem.hash !== 4248210736
            );
          })
        );
      },
      hasMod(item: D2Item) {
        return (
          item.sockets &&
          item.sockets.sockets.some((socket) => {
            return !!(
              socket.plug &&
              ![2323986101, 2600899007, 1835369552, 3851138800].includes(
                socket.plug.plugItem.hash
              ) &&
              socket.plug.plugItem.plug &&
              socket.plug.plugItem.plug.plugCategoryIdentifier.match(
                /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/
              )
            );
          })
        );
      },
      ammoType(item: D2Item, predicate: string) {
        return (
          item.ammoType ===
          {
            primary: DestinyAmmunitionType.Primary,
            special: DestinyAmmunitionType.Special,
            heavy: DestinyAmmunitionType.Heavy
          }[predicate]
        );
      },
      rpm: filterByStats('rpm'),
      charge: filterByStats('charge'),
      rof: filterByStats('rof'),
      impact: filterByStats('impact'),
      range: filterByStats('range'),
      stability: filterByStats('stability'),
      reload: filterByStats('reload'),
      magazine: filterByStats('magazine'),
      aimassist: filterByStats('aimassist'),
      equipspeed: filterByStats('equipspeed'),
      mobility: filterByStats('mobility'),
      recovery: filterByStats('recovery'),
      resilience: filterByStats('resilience'),
      blastradius: filterByStats('blastradius'),
      drawtime: filterByStats('drawtime'),
      inventorysize: filterByStats('inventorysize'),
      recoildirection: filterByStats('recoildirection'),
      velocity: filterByStats('velocity'),
      zoom: filterByStats('zoom')
    }
  };
}
