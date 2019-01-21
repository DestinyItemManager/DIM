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
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';
import { curationsSelector } from '../curated-rolls/reducer';
import { D2SeasonInfo } from '../inventory/d2-season-info';
import { D2EventPredicateLookup } from '../inventory/d2-event-info';
import memoizeOne from 'memoize-one';

/** Make a Regexp that searches starting at a word boundary */
const startWordRegexp = memoizeOne((predicate: string) =>
  // Only some languages effectively use the \b regex word boundary
  ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(
    store.getState().settings.language
  )
    ? new RegExp(`\\b${escapeRegExp(predicate)}`, 'i')
    : new RegExp(escapeRegExp(predicate), 'i')
);

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
  curationsSelector,
  (searchConfig, stores, loadouts, curationsSelector) => {
    return searchFilters(searchConfig, stores, loadouts, curationsSelector.curations);
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

  const source = [
    'edz',
    'titan',
    'nessus',
    'io',
    'mercury',
    'prophecy',
    'mars',
    'tangled',
    'dreaming',
    'shaxx',
    'crucible',
    'trials',
    'ironbanner',
    'zavala',
    'strikes',
    'ikora',
    'gunsmith',
    'shipwright',
    'drifter',
    'gambit',
    'eververse',
    'nm',
    'do',
    'fwc',
    'leviathan',
    'sos',
    'eow',
    'lastwish',
    'prestige',
    'raid',
    'ep',
    'nightfall',
    'adventure',
    'scourge',
    'blackarmory'
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
    dupe: ['dupe', 'duplicate'],
    dupelower: ['dupelower'],
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
      curated: ['curated', 'wishlist'],
      masterwork: ['masterwork', 'masterworks'],
      hasShader: ['shaded', 'hasshader'],
      hasMod: ['modded', 'hasmod'],
      ikelos: ['ikelos'],
      randomroll: ['randomroll'],
      ammoType: ['special', 'primary', 'heavy'],
      event: ['dawning', 'crimsondays', 'solstice', 'fotl']
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

  source.forEach((word) => {
    const filter = `source:${word}`;
    keywords.push(filter);
  });

  const ranges = ['light', 'power', 'level', 'stack', 'count', 'year'];
  if (destinyVersion === 1) {
    ranges.push('quality', 'percentage');
  }

  if (destinyVersion === 2) {
    ranges.push('masterwork');
    ranges.push('season');
    keywords.push('source:');
  }

  if (destinyVersion === 2 && $featureFlags.curatedRolls) {
    ranges.push('curated');
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
  loadouts: Loadout[],
  inventoryCuratedRolls: { [key: string]: InventoryCuratedRoll }
): SearchFilters {
  let _duplicates: { [hash: number]: DimItem[] } | null = null; // Holds a map from item hash to count of occurrances of that hash
  const _maxPowerItems: string[] = [];
  const _lowerDupes = {};
  let _sortedStores: DimStore[] | null = null;
  let _loadoutItemIds: Set<string> | undefined;
  const getLoadouts = _.once(() => dimLoadoutService.getLoadouts());

  function initDupes() {
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
  }

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
    edz: {
      sourceHashes: [
        1373723300,
        783399508,
        790433146,
        1527887247,
        1736997121,
        1861838843,
        1893377622,
        2096915131,
        3754173885,
        4214471686,
        4292996207,
        2851783112,
        2347293565
      ],
      itemHashes: []
    },
    titan: {
      sourceHashes: [3534706087, 194661944, 482012099, 636474187, 354493557],
      itemHashes: []
    },
    nessus: {
      sourceHashes: [
        1906492169,
        164571094,
        1186140085,
        1289998337,
        2040548068,
        2345202459,
        2553369674,
        3067146211,
        3022766747,
        817015032
      ],
      itemHashes: []
    },
    io: {
      sourceHashes: [315474873, 1067250718, 1832642406, 2392127416, 3427537854, 2717017239],
      itemHashes: []
    },
    mercury: {
      sourceHashes: [
        3079246067,
        80684972,
        148542898,
        1400219831,
        1411886787,
        1654120320,
        3079246067,
        4263201695,
        3964663093,
        2487203690,
        1175566043,
        1581680964
      ],
      itemHashes: []
    },
    mars: {
      sourceHashes: [1036506031, 1299614150, 2310754348, 2926805810, 1924238751],
      itemHashes: []
    },
    tangled: { sourceHashes: [1771326504, 4140654910, 2805208672, 110159004], itemHashes: [] },
    dreaming: { sourceHashes: [2559145507, 3874934421], itemHashes: [] },

    ep: { sourceHashes: [4137108180], itemHashes: [] },
    prophecy: { sourceHashes: [3079246067], itemHashes: [] },
    shaxx: { sourceHashes: [897576623, 2537301256, 2641169841], itemHashes: [] },
    crucible: { sourceHashes: [897576623, 2537301256, 2641169841], itemHashes: [] },
    trials: { sourceHashes: [1607607347, 139599745, 3543690049], itemHashes: [] },
    ironbanner: { sourceHashes: [3072862693], itemHashes: [] },
    zavala: { sourceHashes: [2527168932], itemHashes: [] },
    strikes: { sourceHashes: [2527168932], itemHashes: [] },
    ikora: { sourceHashes: [3075817319], itemHashes: [] },
    gunsmith: { sourceHashes: [1788267693], itemHashes: [] },
    shipwright: { sourceHashes: [96303009], itemHashes: [] },
    gambit: { sourceHashes: [2170269026], itemHashes: [] },
    drifter: { sourceHashes: [2170269026], itemHashes: [] },
    eververse: { sourceHashes: [4036739795, 269962496], itemHashes: [] },

    nm: { sourceHashes: [1464399708], itemHashes: [] },
    do: { sourceHashes: [146504277], itemHashes: [] },
    fwc: { sourceHashes: [3569603185], itemHashes: [] },

    leviathan: { sourceHashes: [2653618435, 2765304727, 4009509410], itemHashes: [] },
    sos: { sourceHashes: [1675483099, 2812190367], itemHashes: [] },
    eow: { sourceHashes: [2937902448, 4066007318], itemHashes: [] },
    lastwish: { sourceHashes: [2455011338], itemHashes: [] },
    prestige: { sourceHashes: [2765304727, 2812190367, 4066007318], itemHashes: [] },
    raid: {
      sourceHashes: [
        2653618435,
        2765304727,
        4009509410,
        1675483099,
        2812190367,
        2937902448,
        4066007318,
        2455011338,
        1483048674,
        2085016678,
        4246883461
      ],
      itemHashes: []
    },

    nightfall: {
      sourceHashes: [
        4208190159,
        4263201695,
        3964663093,
        3874934421,
        3067146211,
        3022766747,
        2926805810,
        2851783112,
        2805208672,
        2717017239,
        2487203690,
        2347293565,
        1924238751,
        1175566043,
        1581680964,
        817015032,
        354493557,
        110159004
      ],
      itemHashes: []
    },

    adventure: {
      sourceHashes: [
        80684972,
        194661944,
        482012099,
        636474187,
        783399508,
        790433146,
        1067250718,
        1186140085,
        1289998337,
        1527887247,
        1736997121,
        1861838843,
        1893377622,
        2040548068,
        2096915131,
        2345202459,
        2392127416,
        2553369674,
        3427537854,
        3754173885,
        4214471686
      ],
      itemHashes: []
    },
    scourge: { sourceHashes: [1483048674, 2085016678, 4246883461], itemHashes: [2557722678] },
    blackarmory: {
      sourceHashes: [
        75031309,
        266896577,
        948753311,
        1286332045,
        1457456824,
        1465990789,
        1596507419,
        2062058385,
        2384327872,
        2541753910,
        2966694626,
        3047033583,
        3257722699,
        3390164851,
        3764925750,
        4101102010,
        4120473292,
        4290227252,
        4247521481
      ],
      itemHashes: [
        3211806999,
        3588934839,
        417164956,
        3650581584,
        3650581585,
        3650581586,
        3650581587,
        3650581588,
        3650581589
      ]
    }
  };

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
        } else if (term.startsWith('season:')) {
          const filter = term.replace('season:', '');
          addPredicate('seasonValue', filter, invert);
        } else if (term.startsWith('year:')) {
          const filter = term.replace('year:', '');
          addPredicate('yearValue', filter, invert);
        } else if (term.startsWith('stack:')) {
          const filter = term.replace('stack:', '');
          addPredicate('stack', filter, invert);
        } else if (term.startsWith('count:')) {
          const filter = term.replace('count:', '');
          addPredicate('count', filter, invert);
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
        } else if (term.startsWith('id:')) {
          const filter = term.replace('id:', '');
          addPredicate('id', filter, invert);
        } else if (term.startsWith('hash:')) {
          const filter = term.replace('hash:', '');
          addPredicate('hash', filter, invert);
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
      id(item: DimItem, predicate: string) {
        return item.id === predicate;
      },
      hash(item: DimItem, predicate: string) {
        return item.hash.toString() === predicate;
      },
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
        return !item.locked;
      },
      locked(item: DimItem) {
        return item.locked;
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
      dupelower(item: DimItem) {
        initDupes();
        return _lowerDupes[item.id];
      },
      dupe(item: DimItem) {
        initDupes();

        // We filter out the "Default Shader" because everybody has one per character
        return (
          _duplicates &&
          item.hash !== 4248210736 &&
          _duplicates[item.hash] &&
          _duplicates[item.hash].length > 1
        );
      },
      count(item: DimItem, predicate: string) {
        initDupes();

        return (
          _duplicates &&
          compareByOperand(_duplicates[item.hash] ? _duplicates[item.hash].length : 0, predicate)
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
        const regex = startWordRegexp(predicate);
        return (
          (item.talentGrid &&
            item.talentGrid.nodes.some((node) => {
              // Fixed #798 by searching on the description too.
              return regex.test(node.name) || regex.test(node.description);
            })) ||
          (item.isDestiny2() &&
            item.sockets &&
            item.sockets.sockets.some((socket) =>
              socket.plugOptions.some(
                (plug) =>
                  regex.test(plug.plugItem.displayProperties.name) ||
                  regex.test(plug.plugItem.displayProperties.description) ||
                  plug.perks.some((perk) =>
                    Boolean(
                      (perk.displayProperties.name && regex.test(perk.displayProperties.name)) ||
                        (perk.displayProperties.description &&
                          regex.test(perk.displayProperties.description))
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
        return compareByOperand(
          item.masterworkInfo.statValue && item.masterworkInfo.statValue < 11
            ? item.masterworkInfo.statValue
            : 10,
          predicate
        );
      },
      seasonValue(item: D2Item, predicate: string) {
        return compareByOperand(item.season, predicate);
      },
      yearValue(item: DimItem, predicate: string) {
        if (item.isDestiny1()) {
          return compareByOperand(item.year, predicate);
        } else if (item.isDestiny2()) {
          return compareByOperand(D2SeasonInfo[item.season].year, predicate);
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
          item.dtrRating.ratingCount > 2 &&
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
      event(item: D2Item, predicate: string) {
        if (!item || !D2EventPredicateLookup[predicate] || !item.event) {
          return false;
        }
        return D2EventPredicateLookup[predicate] === item.event;
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
        if (!item || !item.source || !D2Sources[predicate]) {
          return false;
        }
        return (
          D2Sources[predicate].sourceHashes.includes(item.source) ||
          D2Sources[predicate].itemHashes.includes(item.hash)
        );
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
      curated(item: D2Item) {
        const inventoryCuratedRoll = inventoryCuratedRolls[item.id];

        return inventoryCuratedRoll && inventoryCuratedRoll.isCuratedRoll;
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

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
