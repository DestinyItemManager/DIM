import _ from 'lodash';
import idx from 'idx';
import latinise from 'voca/latinise';

import { compareBy, chainComparator, reverseComparator } from '../comparators';
import { DimItem, D1Item, D2Item } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { Loadout, dimLoadoutService } from '../loadout/loadout.service';
import { DestinyAmmunitionType, DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { createSelector } from 'reselect';
import { destinyVersionSelector } from '../accounts/reducer';
import { D1Categories } from '../destiny1/d1-buckets.service';
import { D2Categories } from '../destiny2/d2-buckets.service';
import { querySelector } from '../shell/reducer';
import { sortedStoresSelector } from '../inventory/reducer';
import { maxLightLoadout } from '../loadout/auto-loadouts';
import { itemTags, DimItemInfo, getTag, getNotes } from '../inventory/dim-item-info';
import store from '../store/store';
import { loadoutsSelector } from '../loadout/reducer';
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';
import { inventoryCuratedRollsSelector } from '../curated-rolls/reducer';
import { D2SeasonInfo } from '../inventory/d2-season-info';
import { D2EventPredicateLookup } from 'data/d2/d2-event-info';
import memoizeOne from 'memoize-one';
import { getRating, ratingsSelector, ReviewsState, shouldShowRating } from '../item-review/reducer';
import { RootState } from '../store/reducers';
import Sources from 'data/d2/source-info';

/** Make a Regexp that searches starting at a word boundary */
const latinBased = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(
  store.getState().settings.language
);
const startWordRegexp = memoizeOne((predicate: string) =>
  // Only some languages effectively use the \b regex word boundary
  latinBased
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
  sortedStoresSelector,
  loadoutsSelector,
  inventoryCuratedRollsSelector,
  ratingsSelector,
  (state: RootState) => state.inventory.newItems,
  (state: RootState) => state.inventory.itemInfos,
  searchFilters
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
  const itemTypes = Object.values(categories).flatMap((l: string[]) =>
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
    'equipspeed',
    'handling',
    'blastradius',
    'recoildirection',
    'velocity',
    'zoom'
  ];

  const source = Sources.SourceList;

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
    stats.push('rpm', 'mobility', 'recovery', 'resilience', 'drawtime', 'inventorysize');
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
      reacquirable: ['reacquirable'],
      hasLight: ['light', 'haslight', 'haspower'],
      complete: ['goldborder', 'yellowborder', 'complete'],
      curated: ['curated'],
      wishlist: ['wishlist'],
      wishlistdupe: ['wishlistdupe'],
      masterwork: ['masterwork', 'masterworks'],
      hasShader: ['shaded', 'hasshader'],
      hasMod: ['modded', 'hasmod'],
      ikelos: ['ikelos'],
      randomroll: ['randomroll'],
      ammoType: ['special', 'primary', 'heavy'],
      event: ['dawning', 'crimsondays', 'solstice', 'fotl', 'revelry'],
      powerfulreward: ['powerfulreward']
    });
  }

  if ($featureFlags.reviewsEnabled) {
    filterTrans.hasRating = ['rated', 'hasrating'];
  }

  const keywords: string[] = Object.values(filterTrans)
    .flat()
    .flatMap((word) => [`is:${word}`, `not:${word}`]);

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
  keywords.push('perkname:');

  keywords.push('name:');
  keywords.push('description:');

  // Build an inverse mapping of keyword to function name
  const keywordToFilter: { [key: string]: string } = {};
  _.forIn(filterTrans, (keywords, functionName) => {
    for (const keyword of keywords) {
      keywordToFilter[keyword] = functionName;
    }
  });

  return {
    keywordToFilter,
    keywords: [...new Set(keywords)],
    destinyVersion,
    categoryHashFilters
  };
}

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
  inventoryCuratedRolls: { [key: string]: InventoryCuratedRoll },
  ratings: ReviewsState['ratings'],
  newItems: Set<string>,
  itemInfos: { [key: string]: DimItemInfo }
): SearchFilters {
  let _duplicates: { [hash: number]: DimItem[] } | null = null; // Holds a map from item hash to count of occurrances of that hash
  const _maxPowerItems: string[] = [];
  const _lowerDupes = {};
  let _loadoutItemIds: Set<string> | undefined;
  const getLoadouts = _.once(() => dimLoadoutService.getLoadouts());

  function initDupes() {
    // The comparator for sorting dupes - the first item will be the "best" and all others are "dupelower".
    const dupeComparator = reverseComparator(
      chainComparator(
        // primary stat
        compareBy((item: DimItem) => item.primStat && item.primStat.value),
        compareBy((item: DimItem) => item.masterwork),
        compareBy((item: DimItem) => item.locked),
        compareBy((item: DimItem) => {
          const tag = getTag(item, itemInfos);
          return tag && ['favorite', 'keep'].includes(tag);
        }),
        compareBy((i: DimItem) => i.id) // tiebreak by ID
      )
    );

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

      _.forIn(_duplicates, (dupes: DimItem[]) => {
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

  const curatedPlugsWhitelist = [
    7906839, // frames
    683359327, // guards
    1041766312, // blades
    1202604782, // tubes
    1257608559, // arrows
    1757026848, // batteries
    1806783418, // magazines
    2619833294, // scopes
    2718120384, // magazines_gl
    2833605196, // barrels
    3809303875 // bowstring
  ];

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

  const D2Sources = Sources.Sources;

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
      blastradius: 3614673599,
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
    });

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

      query = query.trim().toLowerCase();
      // http://blog.tatedavies.com/2012/08/28/replace-microsoft-chars-in-javascript/
      query = query.replace(/[\u2018|\u2019|\u201A]/g, "'");
      query = query.replace(/[\u201C|\u201D|\u201E]/g, '"');
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

      function addPredicate(predicate: string, filter: string, invert: boolean) {
        const filterDef: Filter = { predicate, value: filter, invert };
        if (or && filters.length) {
          const lastFilter = filters.pop();
          filters.push({
            predicate: 'or',
            invert: false,
            value: '',
            orFilters: [...(lastFilter!.orFilters! || [lastFilter]), filterDef]
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
        } else if (term.startsWith('perkname:')) {
          const filter = term.replace('perkname:', '').replace(/(^['"]|['"]$)/g, '');
          addPredicate('perkname', filter, invert);
        } else if (term.startsWith('name:')) {
          const filter = term.replace('name:', '').replace(/(^['"]|['"]$)/g, '');
          addPredicate('name', filter, invert);
        } else if (term.startsWith('description:')) {
          const filter = term.replace('description:', '').replace(/(^['"]|['"]$)/g, '');
          addPredicate('description', filter, invert);
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
            addPredicate(filter, pieces[2], invert);
          }
        } else if (term.startsWith('source:')) {
          const filter = term.replace('source:', '');
          addPredicate('source', filter, invert);
        } else if (!/^\s*$/.test(term)) {
          addPredicate('keyword', term.replace(/(^['"]|['"]$)/g, ''), invert);
        }
      }

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
      reacquirable(item: DimItem) {
        if (
          item.isDestiny2() &&
          item.collectibleState !== null &&
          !(item.collectibleState & DestinyCollectibleState.NotAcquired) &&
          !(item.collectibleState & DestinyCollectibleState.PurchaseDisabled)
        ) {
          return true;
        }

        return false;
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
          case 'incurrentchar': {
            const activeStore = stores[0].getStoresService().getActiveStore();
            if (activeStore) {
              desiredStore = activeStore.id;
            } else {
              return false;
            }
          }
        }
        return item.owner === desiredStore;
      },
      location(item: DimItem, predicate: string) {
        let storeIndex = 0;

        switch (predicate) {
          case 'inleftchar':
            storeIndex = 0;
            break;
          case 'inmiddlechar':
            if (stores.length === 4) {
              storeIndex = 1;
            }
            break;
          case 'inrightchar':
            if (stores.length > 2) {
              storeIndex = stores.length - 2;
            }
            break;
          default:
            return false;
        }

        return item.bucket.accountWide
          ? item.owner !== 'vault'
          : item.owner === stores[storeIndex].id;
      },
      classType(item: DimItem, predicate: string) {
        const classes = ['titan', 'hunter', 'warlock'];
        if (item.classified) {
          return false;
        }

        return item.classType === classes.indexOf(predicate);
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
        const tag = getTag(item, itemInfos);
        return (tag || 'none') === predicate;
      },
      notes(item: DimItem, predicate: string) {
        const notes = getNotes(item, itemInfos);
        return notes && notes.toLocaleLowerCase().includes(predicate.toLocaleLowerCase());
      },
      stattype(item: DimItem, predicate: string) {
        return (
          item.stats &&
          item.stats.some((s) =>
            Boolean(s.displayProperties.name.toLowerCase() === predicate && s.value > 0)
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
        const notes = getNotes(item, itemInfos);
        return (
          (latinBased ? latinise(item.name) : item.name).toLowerCase().includes(predicate) ||
          item.description.toLowerCase().includes(predicate) ||
          // Search notes field
          (notes && notes.toLocaleLowerCase().includes(predicate.toLocaleLowerCase())) ||
          // Search for typeName (itemTypeDisplayName of modifications)
          item.typeName.toLowerCase().includes(predicate) ||
          // Search perks as well
          this.perk(item, predicate)
        );
      },
      // name and description searches to narrow search down from "keyword"
      name(item: DimItem, predicate: string) {
        return (latinBased ? latinise(item.name) : item.name).toLowerCase().includes(predicate);
      },
      description(item: DimItem, predicate: string) {
        return item.description.toLowerCase().includes(predicate);
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
      perkname(item: DimItem, predicate: string) {
        const regex = startWordRegexp(predicate);
        return (
          (item.talentGrid &&
            item.talentGrid.nodes.some((node) => {
              return regex.test(node.name);
            })) ||
          (item.isDestiny2() &&
            item.sockets &&
            item.sockets.sockets.some((socket) =>
              socket.plugOptions.some(
                (plug) =>
                  regex.test(plug.plugItem.displayProperties.name) ||
                  plug.perks.some((perk) =>
                    Boolean(perk.displayProperties.name && regex.test(perk.displayProperties.name))
                  )
              )
            ))
        );
      },
      powerfulreward(item: D2Item) {
        return (
          item.pursuit &&
          // TODO: generate in d2ai
          item.pursuit.rewards.some((r) =>
            [
              993006552,
              1204101093,
              1800172820,
              2481239683,
              2484791497,
              2558839803,
              2566956006,
              2646629159,
              2770239081,
              3829523414,
              4143344829,
              4039143015,
              4249081773
            ].includes(r.itemHash)
          )
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
        const dtrRating = getRating(item, ratings);
        return predicate.length !== 0 && dtrRating && dtrRating.overallScore;
      },
      randomroll(item: D2Item) {
        return item.sockets && item.sockets.sockets.some((s) => s.hasRandomizedPlugItems);
      },
      rating(item: DimItem, predicate: string) {
        const dtrRating = getRating(item, ratings);
        const showRating = dtrRating && shouldShowRating(dtrRating) && dtrRating.overallScore;
        return showRating && compareByOperand(dtrRating && dtrRating.overallScore, predicate);
      },
      ratingcount(item: DimItem, predicate: string) {
        const dtrRating = getRating(item, ratings);
        return (
          dtrRating && dtrRating.ratingCount && compareByOperand(dtrRating.ratingCount, predicate)
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
              _.forIn(loadout.items, (items) => {
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
        return newItems.has(item.id);
      },
      tag(item: DimItem) {
        return Boolean(getTag(item, itemInfos));
      },
      hasLight(item: DimItem) {
        return item.primStat && statHashes.has(item.primStat.statHash);
      },
      curated(item: D2Item) {
        if (!item) {
          return false;
        }

        // TODO: remove if there are no false positives, as this precludes maintaining a list for curatedNonMasterwork
        // const masterWork = item.masterworkInfo && item.masterworkInfo.statValue === 10;
        // const curatedNonMasterwork = [792755504, 3356526253, 2034817450].includes(item.hash); // Nightshade, Wishbringer, Distant Relation

        const legendaryWeapon =
          item.bucket && item.bucket.sort === 'Weapons' && item.tier.toLowerCase() === 'legendary';

        const oneSocketPerPlug =
          item.sockets &&
          item.sockets.sockets
            .filter((socket) =>
              curatedPlugsWhitelist.includes(
                idx(socket, (s) => s.plug.plugItem.plug.plugCategoryHash) || 0
              )
            )
            .every((socket) => socket && socket.plugOptions.length === 1);

        return (
          legendaryWeapon &&
          // (masterWork || curatedNonMasterwork) && // checks for masterWork(10) or on curatedNonMasterWork list
          oneSocketPerPlug
        );
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
              ![2323986101, 2600899007, 1835369552, 3851138800, 791435474].includes(
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
      wishlist(item: D2Item) {
        return Boolean(inventoryCuratedRolls[item.id]);
      },
      wishlistdupe(item: D2Item) {
        if (!this.dupe(item) || !_duplicates) {
          return false;
        }

        const itemDupes = _duplicates[item.hash];

        return itemDupes.some(this.wishlist);
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
      handling: filterByStats('equipspeed'), // Synonym
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
