import _ from 'lodash';
import memoizeOne from 'memoize-one';
import idx from 'idx';
import latinise from 'voca/latinise';
import { createSelector } from 'reselect';

import { compareBy, chainComparator, reverseComparator } from '../utils/comparators';
import { DimItem, D1Item, D2Item } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { Loadout, dimLoadoutService } from '../loadout/loadout.service';
import { DestinyAmmunitionType, DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { destinyVersionSelector } from '../accounts/reducer';
import { D1Categories } from '../destiny1/d1-buckets';
import { D2Categories } from '../destiny2/d2-buckets';
import { querySelector } from '../shell/reducer';
import { sortedStoresSelector } from '../inventory/reducer';
import { maxLightLoadout } from '../loadout/auto-loadouts';
import { itemTags, DimItemInfo, getTag, getNotes } from '../inventory/dim-item-info';
import store from '../store/store';
import { loadoutsSelector } from '../loadout/reducer';
import { InventoryCuratedRoll } from '../wishlists/wishlists';
import { inventoryCuratedRollsSelector } from '../wishlists/reducer';
import { D2SeasonInfo } from '../inventory/d2-season-info';
import { getRating, ratingsSelector, ReviewsState, shouldShowRating } from '../item-review/reducer';
import { RootState } from '../store/reducers';

import { D2EventPredicateLookup } from 'data/d2/d2-event-info';
import * as hashes from './search-filter-hashes';
import D2Sources from 'data/d2/source-info';
import seasonTags from 'data/d2/season-tags.json';
import { DEFAULT_SHADER } from 'app/inventory/store/sockets';

/**
 * (to the tune of TMNT) ♪ string processing helper functions ♫
 * these smooth out various quirks for string comparison
 */

/** global language bool. "latin" character sets are the main driver of string processing changes */
const isLatinBased = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(
  store.getState().settings.language
);

/** escape special characters for a regex */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Make a Regexp that searches starting at a word boundary */
const startWordRegexp = memoizeOne(
  (predicate: string) =>
    // Only some languages effectively use the \b regex word boundary
    new RegExp(`${isLatinBased ? '\\b' : ''}${escapeRegExp(predicate)}`, 'i')
);

/** returns input string toLower, and stripped of accents if it's a latin language */
const plainString = (s: string): string => (isLatinBased ? latinise(s) : s).toLowerCase();

/** remove starting and ending quotes ('") e.g. for notes:"this string" */
const trimQuotes = (s: string) => s.replace(/(^['"]|['"]$)/g, '');

/** filter function to use when there's no query */
const alwaysTrue = () => true;

/** strings representing math checks */
const operators = ['<', '>', '<=', '>=', '='];
const operatorsInLengthOrder = _.sortBy(operators, (s) => -s.length);
/** matches a predicate that's probably a math check */
const mathCheck = /^[\d<>=]/;

/**
 * Selectors
 */

export const searchConfigSelector = createSelector(
  destinyVersionSelector,
  buildSearchConfig
);

/** A selector for the search config for a particular destiny version. */
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

/** A selector for a predicate function for searching items, given the current search query. */
export const searchFilterSelector = createSelector(
  querySelector,
  searchFiltersConfigSelector,
  (query, filters) => filters.filterFunction(query)
);

/**
 * SearchConfig
 */

export interface SearchConfig {
  destinyVersion: 1 | 2;
  keywords: string[];
  categoryHashFilters: { [key: string]: number };
  keywordToFilter: { [key: string]: string };
}

/** Builds an object that describes the available search keywords and category mappings. */
export function buildSearchConfig(destinyVersion: 1 | 2): SearchConfig {
  const isD1 = destinyVersion === 1;
  const isD2 = destinyVersion === 2;
  const categories = isD1 ? D1Categories : D2Categories;
  const itemTypes = Object.values(categories).flatMap((l: string[]) =>
    l.map((v) => v.toLowerCase())
  );

  // Add new ItemCategoryHash hashes to this, to add new category searches
  const categoryHashFilters: { [key: string]: number } = {
    ...hashes.D1CategoryHashes,
    ...(isD2 ? hashes.D2CategoryHashes : {})
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
    'zoom',
    ...(isD1 ? ['rof'] : []),
    ...(isD2 ? ['rpm', 'mobility', 'recovery', 'resilience', 'drawtime', 'inventorysize'] : [])
  ];

  /**
   * Filter translation sets. Each right hand value gets an "is:" and a "not:"
   * Key is the filter to run (found in SearchFilters.filters)
   * Values are the keywords that will trigger that key's filter, and set its predicate value
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
    cosmetic: ['cosmetic'],
    ...(isD1
      ? {
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
        }
      : {}),
    ...(isD2
      ? {
          ammoType: ['special', 'primary', 'heavy'],
          hascapacity: ['hascapacity', 'armor2.0'],
          complete: ['goldborder', 'yellowborder', 'complete'],
          curated: ['curated'],
          event: ['dawning', 'crimsondays', 'solstice', 'fotl', 'revelry'],
          hasLight: ['light', 'haslight', 'haspower'],
          hasMod: ['modded', 'hasmod'],
          hasShader: ['shaded', 'hasshader'],
          ikelos: ['ikelos'],
          masterwork: ['masterwork', 'masterworks'],
          powerfulreward: ['powerfulreward'],
          randomroll: ['randomroll'],
          reacquirable: ['reacquirable'],
          wishlist: ['wishlist'],
          wishlistdupe: ['wishlistdupe']
        }
      : {}),
    ...($featureFlags.reviewsEnabled ? { hasRating: ['rated', 'hasrating'] } : {})
  };

  // Filters that operate on numeric ranges with comparison operators
  const ranges = [
    'light',
    'power',
    'stack',
    'count',
    'year',
    ...(isD1 ? ['level', 'quality', 'percentage'] : []),
    ...(isD2 ? ['masterwork', 'season'] : []),
    ...($featureFlags.reviewsEnabled ? ['rating', 'ratingcount'] : [])
  ];

  // Filters that operate with fixed predicate values or freeform text, plus the processed above ranges
  const keywords: string[] = [
    // an "is:" and a "not:" for every filter and its synonyms
    ...Object.values(filterTrans)
      .flat()
      .flatMap((word) => [`is:${word}`, `not:${word}`]),
    ...itemTags.map((tag) => (tag.type ? `tag:${tag.type}` : 'tag:none')),
    // a keyword for every combination of an item stat name and mathmatical operator
    ...stats.flatMap((stat) => operators.map((comparison) => `stat:${stat}:${comparison}`)),
    // keywords for checking which stat is masterworked
    ...stats.map((stat) => `masterwork:${stat}`),
    // keywords for named seasons. reverse so newest seasons are first
    ...Object.keys(seasonTags)
      .reverse()
      .map((tag) => `season:${tag}`),
    // a keyword for every combination of a DIM-processed stat and mathmatical operator
    ...ranges.flatMap((range) => operators.map((comparison) => `${range}:${comparison}`)),
    // energy capacity elements and ranges
    ...hashes.energyCapacityTypes.map((element) => `energycapacity:${element}`),
    ...operators.map((comparison) => `energycapacity:${comparison}`),
    // "source:" keyword plus one for each source
    ...(isD2 ? ['source:', ...Object.keys(D2Sources).map((word) => `source:${word}`)] : []),
    // all the free text searches that support quotes
    ...['notes:', 'perk:', 'perkname:', 'name:', 'description:']
  ];

  // Build an inverse mapping of keyword to function name
  const keywordToFilter: { [key: string]: string } = {};
  _.forIn(filterTrans, (keywords, functionName) => {
    for (const keyword of keywords) {
      keywordToFilter[keyword] = functionName;
    }
  });

  return {
    keywordToFilter,
    keywords: [...new Set(keywords)], // de-dupe kinetic (dmg) & kinetic (slot)
    destinyVersion,
    categoryHashFilters
  };
}

function compareByOperator(compare = 0, predicate: string) {
  if (predicate.length === 0) {
    return false;
  }

  // We must iterate in decreasing length order so that ">=" matches before ">"
  let operator = operatorsInLengthOrder.find((element) => predicate.startsWith(element));
  if (operator) {
    predicate = predicate.substring(operator.length);
  } else {
    operator = 'none';
  }

  const predicateValue = parseFloat(predicate);

  switch (operator) {
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

/**
 * SearchFilters
 */

export interface SearchFilters {
  filters: {
    [predicate: string]: (
      item: DimItem,
      predicate?: string
    ) => boolean | '' | null | undefined | false | number;
  };
  filterFunction(query: string): (item: DimItem) => boolean;
}

/** This builds an object that can be used to generate filter functions from search queried. */
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

  // This refactored method filters items by stats
  //   * statType = [aa|impact|range|stability|rof|reload|magazine|equipspeed|mobility|resilience|recovery]
  const filterByStats = (statType: string) => {
    const statHash = hashes.statHashByName[statType];

    return (item: DimItem, predicate: string) => {
      const foundStatHash = item.stats && item.stats.find((s) => s.statHash === statHash);
      return foundStatHash && compareByOperator(foundStatHash.value, predicate);
    };
  };

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
      // \S*?(["']).*?\1 -> match `is:"stuff here"` or `is:'stuff here'`
      // [^\s"']+ -> match is:stuff
      const searchTerms = query.match(/\S*?(["']).*?\1|[^\s"']+/g) || [];
      interface Filter {
        invert: boolean;
        value: string;
        predicate: string;
        orFilters?: Filter[];
      }
      const filterStack: Filter[] = [];

      // The entire implementation of "or" is a dirty hack - we should really
      // build an expression tree instead. But here, we flip a flag when we see
      // an "or" token, and then on the next filter we instead combine the filter
      // with the previous one in a hacked-up "or" node that we'll handle specially.
      let or = false;

      function addPredicate(predicate: string, filterValue: string, invert: boolean) {
        const filterDef: Filter = { predicate, value: filterValue, invert };
        if (or && filterStack.length) {
          const lastFilter = filterStack.pop();
          filterStack.push({
            predicate: 'or',
            invert: false,
            value: '',
            orFilters: [...(lastFilter!.orFilters! || [lastFilter]), filterDef]
          });
        } else {
          filterStack.push(filterDef);
        }
        or = false;
      }

      for (const search of searchTerms) {
        // i.e. ["-not:tagged", "-", "not:", "not", "tagged"
        const [, invertString, , filterName, filterValue] =
          search.match(/^(-?)(([^:]+):)?(.+)$/) || [];
        let invert = Boolean(invertString);

        if (filterValue === 'or') {
          or = true;
        } else {
          switch (filterName) {
            case 'not':
              invert = !invert;
            // fall through intentionally after setting "not" inversion eslint demands this comment :|
            case 'is': {
              // do a lookup by filterValue (i.e. arc)
              // to find the appropriate predicate (i.e. dmg)
              const predicate = searchConfig.keywordToFilter[filterValue];
              if (predicate) {
                addPredicate(predicate, filterValue, invert);
              }
              break;
            }
            // translate this filter name from search field name to actual name
            case 'tag':
              addPredicate('itemtags', filterValue, invert);
              break;
            // filters whose filterValue needs outer quotes trimmed
            case 'notes':
            case 'perk':
            case 'perkname':
            case 'name':
            case 'description':
              addPredicate(filterName, trimQuotes(filterValue), invert);
              break;
            // normalize synonyms
            case 'light':
            case 'power':
              addPredicate('light', filterValue, invert);
              break;
            case 'quality':
            case 'percentage':
              addPredicate('quality', filterValue, invert);
              break;
            // filter names with "Value" in the actual filter name but not in search bar
            // currently just masterworkValue but depends on name collisions
            case 'masterwork':
              addPredicate(`${filterName}Value`, filterValue, invert);
              break;
            // pass these filter names and values unaltered
            case 'season':
            case 'year':
            case 'stack':
            case 'count':
            case 'energycapacity':
            case 'level':
            case 'rating':
            case 'ratingcount':
            case 'id':
            case 'hash':
            case 'source':
              addPredicate(filterName, filterValue, invert);
              break;
            // stat filter has sub-searchterm and needs further separation
            case 'stat': {
              const pieces = filterValue.split(':');
              if (pieces.length === 2) {
                //           statName   statValue
                addPredicate(pieces[0], pieces[1], invert);
              }
              break;
            }
            // if nothing else matches we cast a wide net and do the powerful keyword search
            default:
              if (!/^\s*$/.test(filterValue)) {
                addPredicate('keyword', trimQuotes(filterValue), invert);
              }
          }
        }
      }

      return (item: DimItem) =>
        filterStack.every((filter) => {
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
        return hashes.sublimeEngrams.includes(item.hash);
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

        // We filter out the InventoryItem "Default Shader" because everybody has one per character
        return (
          _duplicates &&
          item.hash !== DEFAULT_SHADER &&
          _duplicates[item.hash] &&
          _duplicates[item.hash].length > 1
        );
      },
      count(item: DimItem, predicate: string) {
        initDupes();

        return (
          _duplicates &&
          compareByOperator(_duplicates[item.hash] ? _duplicates[item.hash].length : 0, predicate)
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
        switch (predicate) {
          case 'glimmerboost':
            return hashes.boosts.includes(item.hash);
          case 'glimmersupply':
            return hashes.supplies.includes(item.hash);
          case 'glimmeritem':
            return hashes.boosts.includes(item.hash) || hashes.supplies.includes(item.hash);
        }
        return false;
      },
      itemtags(item: DimItem, predicate: string) {
        const tag = getTag(item, itemInfos);
        return (tag || 'none') === predicate;
      },
      notes(item: DimItem, predicate: string) {
        const notes = getNotes(item, itemInfos);
        return notes && notes.toLocaleLowerCase().includes(predicate);
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
        return compareByOperator(item.amount, predicate);
      },
      engram(item: DimItem) {
        return item.isEngram;
      },
      infusable(item: DimItem) {
        return item.infusable;
      },
      categoryHash(item: D2Item, predicate: string) {
        const categoryHash = searchConfig.categoryHashFilters[predicate.replace(/\s/g, '')];

        if (!categoryHash) {
          return false;
        }
        return item.itemCategoryHashes.includes(categoryHash);
      },
      keyword(item: DimItem, predicate: string) {
        const notes = getNotes(item, itemInfos);
        return (
          plainString(item.name).includes(predicate) ||
          item.description.toLowerCase().includes(predicate) ||
          // Search notes field
          (notes && notes.toLocaleLowerCase().includes(predicate)) ||
          // Search for typeName (itemTypeDisplayName of modifications)
          item.typeName.toLowerCase().includes(predicate) ||
          // Search perks as well
          this.perk(item, predicate)
        );
      },
      // name and description searches to use if "keyword" picks up too much
      name(item: DimItem, predicate: string) {
        return plainString(item.name).includes(predicate);
      },
      description(item: DimItem, predicate: string) {
        return item.description.toLowerCase().includes(predicate);
      },
      perk(item: DimItem, predicate: string) {
        const regex = startWordRegexp(predicate);
        return (
          (item.talentGrid &&
            item.talentGrid.nodes.some((node) => {
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
          item.pursuit.rewards.some((r) => hashes.powerfulSources.includes(r.itemHash))
        );
      },
      light(item: DimItem, predicate: string) {
        if (!item.primStat) {
          return false;
        }
        return compareByOperator(item.primStat.value, predicate);
      },
      masterworkValue(item: D2Item, predicate: string) {
        if (!item.masterworkInfo) {
          return false;
        }
        if (mathCheck.test(predicate)) {
          return compareByOperator(
            item.masterworkInfo.tier && item.masterworkInfo.tier < 11
              ? item.masterworkInfo.tier
              : 10,
            predicate
          );
        }
        return (
          hashes.statHashByName[predicate] && // make sure it exists or undefined can match undefined
          hashes.statHashByName[predicate] === item.masterworkInfo.statHash
        );
      },
      season(item: D2Item, predicate: string) {
        if (mathCheck.test(predicate)) {
          return compareByOperator(item.season, predicate);
        }
        return seasonTags[predicate] && seasonTags[predicate] === item.season;
      },
      year(item: DimItem, predicate: string) {
        if (item.isDestiny1()) {
          return compareByOperator(item.year, predicate);
        } else if (item.isDestiny2()) {
          return compareByOperator(D2SeasonInfo[item.season].year, predicate);
        }
      },
      level(item: DimItem, predicate: string) {
        return compareByOperator(item.equipRequiredLevel, predicate);
      },
      energycapacity(item: D2Item, predicate: string) {
        if (item.energy) {
          return (
            (mathCheck.test(predicate) &&
              compareByOperator(item.energy.energyCapacity, predicate)) ||
            predicate === item.dmg
          );
        }
      },
      hascapacity(item: D2Item) {
        return !!item.energy;
      },
      quality(item: D1Item, predicate: string) {
        if (!item.quality) {
          return false;
        }
        return compareByOperator(item.quality.min, predicate);
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
        return showRating && compareByOperator(dtrRating && dtrRating.overallScore, predicate);
      },
      ratingcount(item: DimItem, predicate: string) {
        const dtrRating = getRating(item, ratings);
        return (
          dtrRating && dtrRating.ratingCount && compareByOperator(dtrRating.ratingCount, predicate)
        );
      },
      event(item: D2Item, predicate: string) {
        if (!item || !D2EventPredicateLookup[predicate] || !item.event) {
          return false;
        }
        return D2EventPredicateLookup[predicate] === item.event;
      },
      vendor(item: D1Item, predicate: string) {
        if (!item) {
          return false;
        }
        if (hashes.vendorHashes.restricted[predicate]) {
          return (
            hashes.vendorHashes.required[predicate].some((vendorHash) =>
              item.sourceHashes.includes(vendorHash)
            ) &&
            !hashes.vendorHashes.restricted[predicate].some((vendorHash) =>
              item.sourceHashes.includes(vendorHash)
            )
          );
        } else {
          return hashes.vendorHashes.required[predicate].some((vendorHash) =>
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
      activity(item: D1Item, predicate: string) {
        if (!item) {
          return false;
        }
        if (predicate === 'vanilla') {
          return item.year === 1;
        } else if (hashes.D1ActivityHashes.restricted[predicate]) {
          return (
            hashes.D1ActivityHashes.required[predicate].some((sourceHash) =>
              item.sourceHashes.includes(sourceHash)
            ) &&
            !hashes.D1ActivityHashes.restricted[predicate].some((sourceHash) =>
              item.sourceHashes.includes(sourceHash)
            )
          );
        } else {
          return hashes.D1ActivityHashes.required[predicate].some((sourceHash) =>
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
        return item.primStat && hashes.lightStats.includes(item.primStat.statHash);
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
              hashes.curatedPlugsWhitelist.includes(
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
        return hashes.ikelos.includes(item.hash);
      },
      cosmetic(item: DimItem) {
        return hashes.cosmeticTypes.includes(item.type);
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
                socket.plug.plugItem.plug.plugCategoryHash === hashes.shaderBucket &&
                socket.plug.plugItem.hash !== DEFAULT_SHADER
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
              !hashes.emptySocketHashes.includes(socket.plug.plugItem.hash) &&
              socket.plug.plugItem.plug &&
              socket.plug.plugItem.plug.plugCategoryIdentifier.match(
                /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/
              ) &&
              // enforce that this provides a perk (excludes empty slots)
              socket.plug.plugItem.perks.length &&
              // enforce that this doesn't have an energy cost (y3 reusables)
              !socket.plug.plugItem.plug.energyCost
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
