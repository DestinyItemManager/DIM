import { D1Item, D2Item, DimItem } from '../inventory/item-types';
import {
  DestinyAmmunitionType,
  DestinyClass,
  DestinyCollectibleState,
  DestinyItemSubType,
} from 'bungie-api-ts/destiny2';
import { ItemInfos, getNotes, getTag, itemTagSelectorList } from '../inventory/dim-item-info';
import { ReviewsState, getRating, ratingsSelector, shouldShowRating } from '../item-review/reducer';
import { chainComparator, compareBy, reverseComparator } from '../utils/comparators';
import {
  getItemDamageShortName,
  getSpecialtySocketMetadata,
  modSlotTags,
  getItemPowerCapFinalSeason,
} from 'app/utils/item-utils';
import {
  itemInfosSelector,
  sortedStoresSelector,
  currentStoreSelector,
  itemHashTagsSelector,
} from '../inventory/selectors';
import { maxLightItemSet, maxStatLoadout } from '../loadout/auto-loadouts';

import { D1Categories } from '../destiny1/d1-buckets';
import { D2Categories } from '../destiny2/d2-buckets';
import { D2EventPredicateLookup } from 'data/d2/d2-event-info';
import { D2SeasonInfo } from 'data/d2/d2-season-info';
import D2Sources from 'data/d2/source-info';
import { DimStore } from '../inventory/store-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import { Loadout } from '../loadout/loadout-types';
import { RootState } from 'app/store/types';
import missingSources from 'data/d2/missing-source-info';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { destinyVersionSelector } from '../accounts/selectors';
import { inventoryWishListsSelector } from '../wishlists/reducer';
import latinise from 'voca/latinise';
import { loadoutsSelector } from '../loadout/reducer';
import memoizeOne from 'memoize-one';
import { querySelector } from '../shell/reducer';
import seasonTags from 'data/d2/season-tags.json';
import { settingsSelector } from 'app/settings/reducer';
import store from '../store/store';
import { getStore } from 'app/inventory/stores-helpers';
import { DestinyVersion, ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { parseQuery, QueryAST } from './query-parser';
import {
  boosts,
  D1ActivityHashes,
  D1ItemCategoryHashes,
  sublimeEngrams,
  supplies,
  vendorHashes,
} from './d1-known-values';
import {
  breakerTypes,
  curatedPlugsAllowList,
  D2ItemCategoryHashesByName,
  DEFAULT_GLOW,
  DEFAULT_ORNAMENTS,
  DEFAULT_SHADER,
  emptySocketHashes,
  energyCapacityTypeNames,
  energyNamesByEnum,
  powerfulSources,
  SEASONAL_ARTIFACT_BUCKET,
  SHADERS_BUCKET,
} from './d2-known-values';
import {
  allStatNames,
  armorAnyStatHashes,
  armorStatHashes,
  cosmeticTypes,
  damageTypeNames,
  lightStats,
  searchableStatNames,
  statHashByName,
} from './search-filter-values';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

/**
 * (to the tune of TMNT) ♪ string processing helper functions ♫
 * these smooth out various quirks for string comparison
 */

/** global language bool. "latin" character sets are the main driver of string processing changes */
const isLatinBased = () =>
  ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(
    settingsSelector(store.getState()).language
  );

/** escape special characters for a regex */
export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Make a Regexp that searches starting at a word boundary */
const startWordRegexp = memoizeOne(
  (s: string) =>
    // Only some languages effectively use the \b regex word boundary
    new RegExp(`${isLatinBased() ? '\\b' : ''}${escapeRegExp(s)}`, 'i')
);

/** returns input string toLower, and stripped of accents if it's a latin language */
const plainString = (s: string): string => (isLatinBased() ? latinise(s) : s).toLowerCase();

/** strings representing math checks */
const operators = ['<', '>', '<=', '>=', '='];
const operatorsInLengthOrder = _.sortBy(operators, (s) => -s.length);
/** matches a filterValue that's probably a math check */
const mathCheck = /^[\d<>=]/;

/** replaces a word with a corresponding season i.e. turns `<=forge` into `<=5`.
 * use only on simple filter values where there's not other letters */
const replaceSeasonTagWithNumber = (s: string) => s.replace(/[a-z]+$/i, (tag) => seasonTags[tag]);
// so, duplicate detection has gotten complicated in season 8. same items can have different hashes.
// we use enough values to ensure this item is intended to be the same, as the index for looking up dupes

/** outputs a string combination of the identifying features of an item, or the hash if classified */
export const makeDupeID = (item: DimItem) =>
  (item.classified && `${item.hash}`) ||
  `${item.name}${item.classType}${item.tier}${item.itemCategoryHashes.join('.')}`;

export const makeSeasonalDupeID = (item: DimItem) =>
  (item.classified && `${item.hash}`) ||
  `${item.name}${item.classType}${item.tier}${
    item.isDestiny2() ? `${item.collectibleHash}${item.powerCap}` : ''
  }${item.itemCategoryHashes.join('.')}`;

//
// Selectors
//

export const searchConfigSelector = createSelector(destinyVersionSelector, buildSearchConfig);

/** A selector for the search config for a particular destiny version. */
export const searchFiltersConfigSelector = createSelector(
  searchConfigSelector,
  sortedStoresSelector,
  currentStoreSelector,
  loadoutsSelector,
  inventoryWishListsSelector,
  ratingsSelector,
  (state: RootState) => state.inventory.newItems,
  itemInfosSelector,
  itemHashTagsSelector,
  searchFilters
);

/** A selector for a function for searching items, given the current search query. */
export const searchFilterSelector = createSelector(
  querySelector,
  searchFiltersConfigSelector,
  (query, filters) => filters.filterFunction(query)
);

//
// SearchConfig
//

export interface SearchConfig {
  destinyVersion: DestinyVersion;
  keywords: string[];
  categoryHashFilters: { [key: string]: number };
  keywordToFilter: { [key: string]: string };
}

/** Builds an object that describes the available search keywords and category mappings. */
export function buildSearchConfig(destinyVersion: DestinyVersion): SearchConfig {
  const isD1 = destinyVersion === 1;
  const isD2 = destinyVersion === 2;
  const categories = isD1 ? D1Categories : D2Categories;
  const itemTypes = Object.values(categories).flatMap((l: string[]) =>
    l.map((v) => v.toLowerCase())
  );

  // Add new ItemCategoryHash hashes to this, to add new category searches
  const categoryHashFilters: { [key: string]: number } = {
    ...D1ItemCategoryHashes,
    ...(isD2 ? D2ItemCategoryHashesByName : {}),
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
    'discipline',
    'intellect',
    'strength',
    ...(isD1 ? ['rof'] : []),
    ...(isD2
      ? [
          'rpm',
          'mobility',
          'recovery',
          'resilience',
          'drawtime',
          'inventorysize',
          'total',
          'custom',
          'any',
        ]
      : []),
  ];

  /**
   * sets of single key -> multiple values
   *
   * keys: the filter to run
   *
   * values: the strings that trigger this filter, and the value to feed into that filter
   *
   */
  // i.e. { dmg: ['arc', 'solar', 'void'] }
  // so search string 'arc' runs dmg('arc'), search string 'solar' runs dmg('solar') etc
  const singleTermFilters: {
    [key: string]: string[];
  } = {
    dmg: damageTypeNames,
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
      'yellow',
    ],
    classType: ['titan', 'hunter', 'warlock'],
    dupe: ['dupe', 'duplicate'],
    seasonaldupe: ['seasonaldupe', 'seasonalduplicate'],
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
    tagged: ['tagged'],
    level: ['level'],
    equipment: ['equipment', 'equippable'],
    postmaster: ['postmaster', 'inpostmaster'],
    equipped: ['equipped'],
    transferable: ['transferable', 'movable'],
    infusable: ['infusable', 'infuse'],
    owner: ['invault', 'incurrentchar'],
    location: ['inleftchar', 'inmiddlechar', 'inrightchar'],
    onwrongclass: ['onwrongclass'],
    hasnotes: ['hasnotes'],
    cosmetic: ['cosmetic'],
    tracked: ['tracked'],
    untracked: ['untracked'],
    ...(isD1
      ? {
          hasLight: ['light', 'haslight'],
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
            'gunsmith',
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
            'aot',
          ],
        }
      : {}),
    ...(isD2
      ? {
          ammoType: ['special', 'primary', 'heavy'],
          hascapacity: ['hascapacity', 'armor2.0'],
          complete: ['goldborder', 'yellowborder', 'complete'],
          curated: ['curated'],
          hasLight: ['light', 'haslight', 'haspower'],
          hasMod: ['hasmod'],
          modded: ['modded'],
          hasShader: ['shaded', 'hasshader'],
          hasOrnament: ['ornamented', 'hasornament'],
          masterworked: ['masterwork', 'masterworks'],
          powerfulreward: ['powerfulreward'],
          randomroll: ['randomroll'],
          reacquirable: ['reacquirable'],
          trashlist: ['trashlist'],
          wishlist: ['wishlist'],
          wishlistdupe: ['wishlistdupe'],
        }
      : {}),
    ...($featureFlags.reviewsEnabled ? { hasRating: ['rated', 'hasrating'] } : {}),
  };

  // Filters that operate on numeric ranges with comparison operators
  const ranges = [
    'light',
    'power',
    'stack',
    'count',
    'year',
    ...(isD1 ? ['level', 'quality', 'percentage'] : []),
    ...(isD2 ? ['masterwork', 'season', 'powerlimit', 'sunsetsafter', 'powerlimitseason'] : []),
    ...($featureFlags.reviewsEnabled ? ['rating', 'ratingcount'] : []),
  ];

  // build search suggestions for single-term filters, or freeform text, or the above ranges
  const keywords: string[] = [
    // an "is:" and a "not:" for every filter and its synonyms
    ...Object.values(singleTermFilters)
      .flat()
      .flatMap((word) => [`is:${word}`, `not:${word}`]),
    ...itemTagSelectorList.map((tag) => (tag.type ? `tag:${tag.type}` : 'tag:none')),
    // a keyword for every combination of an item stat name and mathmatical operator
    ...stats.flatMap((stat) => operators.map((comparison) => `stat:${stat}:${comparison}`)),
    // additional basestat searches for armor stats
    ...searchableStatNames.flatMap((stat) =>
      operators.map((comparison) => `basestat:${stat}:${comparison}`)
    ),
    // keywords for checking which stat is masterworked
    ...(isD2 ? stats.map((stat) => `masterwork:${stat}`) : []),
    // keywords for named seasons. reverse so newest seasons are first
    ...(isD2
      ? Object.keys(seasonTags)
          .reverse()
          .map((tag) => `season:${tag}`)
      : []),
    // keywords for seasonal mod slots
    ...(isD2
      ? modSlotTags.concat(['any', 'none']).map((modSlotName) => `modslot:${modSlotName}`)
      : []),
    ...(isD2
      ? modSlotTags.concat(['any', 'none']).map((modSlotName) => `holdsmod:${modSlotName}`)
      : []),
    // a keyword for every combination of a DIM-processed stat and mathmatical operator
    ...ranges.flatMap((range) => operators.map((comparison) => `${range}:${comparison}`)),
    // energy capacity elements and ranges
    ...(isD2 ? energyCapacityTypeNames.map((element) => `energycapacity:${element}`) : []),
    ...(isD2 ? operators.map((comparison) => `energycapacity:${comparison}`) : []),
    // keywords for checking when an item hits power limit. s11 is the first valid season for this
    ...(isD2
      ? Object.entries(seasonTags)
          .filter(([, seasonNumber]) => seasonNumber > 10)
          .reverse()
          .map(([tag]) => `sunsetsafter:${tag}`)
      : []),
    ...(isD2 ? Object.keys(breakerTypes).map((breakerType) => `breaker:${breakerType}`) : []),
    // "source:" keyword plus one for each source
    ...(isD2
      ? [
          'source:',
          'wishlistnotes:',
          ...Object.keys(D2Sources).map((word) => `source:${word}`),
          ...Object.keys(D2EventPredicateLookup).map((word) => `source:${word}`),
          // maximum stat finders
          ...searchableStatNames.map((armorStat) => `maxbasestatvalue:${armorStat}`),
          ...searchableStatNames.map((armorStat) => `maxstatvalue:${armorStat}`),
          ...searchableStatNames.map((armorStat) => `maxstatloadout:${armorStat}`),
        ]
      : []),
    // all the free text searches that support quotes
    ...['notes:', 'perk:', 'perkname:', 'name:', 'description:'],
  ];

  // create suggestion stubs for filter names
  const keywordStubs = keywords.flatMap((keyword) => {
    const keywordSegments = keyword //   'basestat:mobility:<='
      .split(':') //                   [ 'basestat' , 'mobility' , '<=']
      .slice(0, -1); //                [ 'basestat' , 'mobility' ]
    const stubs: string[] = [];
    for (let i = 1; i <= keywordSegments.length; i++) {
      stubs.push(keywordSegments.slice(0, i).join(':') + ':');
    }
    return stubs; //                   [ 'basestat:' , 'basestat:mobility:' ]
  });
  keywords.push(...new Set(keywordStubs));

  // Build an inverse mapping of keyword to function name
  const keywordToFilter: { [key: string]: string } = {};
  _.forIn(singleTermFilters, (keywords, functionName) => {
    for (const keyword of keywords) {
      keywordToFilter[keyword] = functionName;
    }
  });

  return {
    keywordToFilter,
    keywords: [...new Set(keywords)], // de-dupe kinetic (dmg) & kinetic (slot)
    destinyVersion,
    categoryHashFilters,
  };
}
/**
 * compares a number to a parsed string which contains a math operator and a number.
 * compare is safe to be a non-number value, just something can be ==='d or <'d
 */
function compareByOperator(number = 0, comparison: string) {
  if (!comparison) {
    return false;
  }

  // We must iterate in decreasing length order so that ">=" matches before ">"
  let operator = operatorsInLengthOrder.find((element) => comparison.startsWith(element));
  if (operator) {
    comparison = comparison.substring(operator.length);
  } else {
    operator = 'none';
  }

  const comparisonValue = parseFloat(comparison);
  switch (operator) {
    case 'none':
    case '=':
      return number === comparisonValue;
    case '<':
      return number < comparisonValue;
    case '<=':
      return number <= comparisonValue;
    case '>':
      return number > comparisonValue;
    case '>=':
      return number >= comparisonValue;
  }
  return false;
}

/**
 * SearchFilters
 */

export interface SearchFilters {
  filters: {
    [filterName: string]: (
      item: DimItem,
      filterValue?: string
    ) => boolean | '' | null | undefined | false | number;
  };
  filterFunction(query: string): (item: DimItem) => boolean;
}

/** This builds an object that can be used to generate filter functions from search queried. */
function searchFilters(
  searchConfig: SearchConfig,
  stores: DimStore[],
  currentStore: DimStore,
  loadouts: Loadout[],
  inventoryWishListRolls: { [key: string]: InventoryWishListRoll },
  ratings: ReviewsState['ratings'],
  newItems: Set<string>,
  itemInfos: ItemInfos,
  itemHashTags: {
    [itemHash: string]: ItemHashTag;
  }
): SearchFilters {
  // TODO: do these with memoize-one
  let _duplicates: { [dupeID: string]: DimItem[] } | null = null; // Holds a map from item hash to count of occurrances of that hash
  let _duplicates_seasonal: { [dupeID: string]: DimItem[] } | null = null; // Holds a map from item hash to count of occurrances of that hash
  const _maxPowerLoadoutItems: string[] = [];
  const _maxStatLoadoutItems: { [key: string]: string[] } = {};
  let _maxStatValues: {
    [key: string]: { [key: string]: { value: number; base: number } };
  } | null = null;
  const _lowerDupes = {};
  let _loadoutItemIds: Set<string> | undefined;

  function initDupes() {
    // The comparator for sorting dupes - the first item will be the "best" and all others are "dupelower".
    const dupeComparator = reverseComparator(
      chainComparator<DimItem>(
        // primary stat
        compareBy((item) => item.primStat?.value),
        compareBy((item) => item.masterwork),
        compareBy((item) => item.locked),
        compareBy((item) => {
          const tag = getTag(item, itemInfos, itemHashTags);
          return Boolean(tag && ['favorite', 'keep'].includes(tag));
        }),
        compareBy((i) => i.id) // tiebreak by ID
      )
    );

    if (_duplicates === null) {
      _duplicates = {};
      _duplicates_seasonal = {};
      for (const store of stores) {
        for (const i of store.items) {
          const dupeID = makeDupeID(i);
          const seasonalDupeID = makeSeasonalDupeID(i);
          if (!_duplicates[dupeID]) {
            _duplicates[dupeID] = [];
          }
          if (!_duplicates_seasonal[seasonalDupeID]) {
            _duplicates_seasonal[seasonalDupeID] = [];
          }
          _duplicates[dupeID].push(i);
          _duplicates_seasonal[seasonalDupeID].push(i);
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

      _.forIn(_duplicates_seasonal, (dupes: DimItem[]) => {
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

  function gatherHighestStatsPerSlot() {
    if (_maxStatValues === null) {
      _maxStatValues = {};

      for (const store of stores) {
        for (const i of store.items) {
          if (!i.bucket.inArmor || !i.stats || !i.isDestiny2()) {
            continue;
          }
          const itemSlot = `${i.classType}${i.type}`;
          if (!(itemSlot in _maxStatValues)) {
            _maxStatValues[itemSlot] = {};
          }
          if (i.stats) {
            for (const stat of i.stats) {
              if (armorStatHashes.includes(stat.statHash)) {
                _maxStatValues[itemSlot][stat.statHash] =
                  // just assign if this is the first
                  !(stat.statHash in _maxStatValues[itemSlot])
                    ? { value: stat.value, base: stat.base }
                    : // else we are looking for the biggest stat
                      {
                        value: Math.max(_maxStatValues[itemSlot][stat.statHash].value, stat.value),
                        base: Math.max(_maxStatValues[itemSlot][stat.statHash].base, stat.base),
                      };
              }
            }
          }
        }
      }
    }
  }

  /**
   * given a stat name, this returns a function for comparing that stat
   */
  const filterByStats = (statType: string, byBaseValue = false) => {
    const byWhichValue = byBaseValue ? 'base' : 'value';
    const statHashes: number[] =
      statType === 'any' ? armorAnyStatHashes : [statHashByName[statType]];
    return (item: DimItem, filterValue: string) => {
      const matchingStats = item.stats?.filter(
        (s) => statHashes.includes(s.statHash) && compareByOperator(s[byWhichValue], filterValue)
      );
      return matchingStats && Boolean(matchingStats.length);
    };
  };

  // reset, filterFunction, and filters
  return {
    /**
     * Build a complex filter function from a full query string.
     */
    filterFunction: memoizeOne(function (query: string): (item: DimItem) => boolean {
      query = query.trim().toLowerCase();
      if (!query.length) {
        // By default, show anything that doesn't have the archive tag
        return (item: DimItem) => getTag(item, itemInfos, itemHashTags) !== 'archive';
      }

      const parsedQuery = parseQuery(query);
      const filterTable = this.filters;

      // Transform our query syntax tree into a filter function by recursion.
      // TODO: break these out into standalone, tested functions!
      const transformAST = (ast: QueryAST): ((item: DimItem) => boolean) => {
        switch (ast.op) {
          case 'and': {
            const fns = ast.operands.map(transformAST);
            return (item) => {
              for (const fn of fns) {
                if (!fn(item)) {
                  return false;
                }
              }
              return true;
            };
          }
          case 'or': {
            const fns = ast.operands.map(transformAST);
            return (item) => {
              for (const fn of fns) {
                if (fn(item)) {
                  return true;
                }
              }
              return false;
            };
          }
          case 'not': {
            const fn = transformAST(ast.operand);
            return (item) => !fn(item);
          }
          case 'filter': {
            // TODO: break this out into its own function that takes the filter table as an arg
            const { type: filterName, args: filterValue } = ast;

            // Generate a filter function from the filters table
            const filterByTable = (filterName: string, filterValue: string) => {
              if (filterTable[filterName]) {
                const filterFunction = filterTable[filterName] as (
                  item: DimItem,
                  val: string
                ) => boolean;
                return (item: DimItem) => filterFunction.call(filterTable, item, filterValue);
              }
              return () => true;
            };

            switch (filterName) {
              case 'is': {
                // do a lookup by filterValue (i.e. arc)
                // to find the appropriate filterFunction (i.e. dmg)
                const filterName = searchConfig.keywordToFilter[filterValue];
                return filterByTable(filterName, filterValue);
              }
              // normalize synonyms
              case 'light':
              case 'power':
                return filterByTable('light', filterValue);
              case 'quality':
              case 'percentage':
                return filterByTable('quality', filterValue);
              // mutate filterValues where keywords (forge) should be translated into seasons (5)
              case 'powerlimitseason':
              case 'sunsetsafter':
                return filterByTable('sunsetsafter', replaceSeasonTagWithNumber(filterValue));
              case 'season':
                return filterByTable('season', replaceSeasonTagWithNumber(filterValue));
              // stat filter has sub-searchterm and needs further separation
              case 'basestat':
              case 'stat': {
                const [statName, statValue, shouldntExist] = filterValue.split(':');
                const statFilterName = filterName === 'basestat' ? `base${statName}` : statName;
                if (!shouldntExist) {
                  return filterByTable(statFilterName, statValue);
                }
                break;
              }
              default:
                // All other keywords just pass through to filter table lookups
                return filterByTable(filterName, filterValue);
            }

            return () => true;
          }
        }

        return () => true;
      };

      return transformAST(parsedQuery);
    }),

    /**
     * Each entry in this map is a filter function that will be provided the normalized
     * query term and an item, and should return whether or not it matches the filter.
     * @param filterValue The parameter for the filter function - for example,
     * is:arc gets the 'elemental' filter function, with filterValue='arc'
     * @param item The item to test against.
     * @return Returns true for a match, false for a non-match
     */
    filters: {
      id(item: DimItem, filterValue: string) {
        return item.id === filterValue;
      },
      hash(item: DimItem, filterValue: string) {
        return item.hash.toString() === filterValue;
      },
      dmg(item: DimItem, filterValue: string) {
        return getItemDamageShortName(item) === filterValue;
      },
      type(item: DimItem, filterValue: string) {
        return item.type?.toLowerCase() === filterValue;
      },
      tier(item: DimItem, filterValue: string) {
        const tierMap = {
          white: 'common',
          green: 'uncommon',
          blue: 'rare',
          purple: 'legendary',
          yellow: 'exotic',
        };
        return item.tier.toLowerCase() === (tierMap[filterValue] || filterValue);
      },
      sublime(item: DimItem) {
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
        return item.talentGrid?.xpComplete && !item.complete;
      },
      xpincomplete(item: D1Item) {
        return item.talentGrid && !item.talentGrid.xpComplete;
      },
      xpcomplete(item: D1Item) {
        return item.talentGrid?.xpComplete;
      },
      ascended(item: D1Item) {
        return item.talentGrid?.hasAscendNode && item.talentGrid.ascended;
      },
      unascended(item: D1Item) {
        return item.talentGrid?.hasAscendNode && !item.talentGrid.ascended;
      },
      reforgeable(item: DimItem) {
        return item.talentGrid?.nodes.some((n) => n.hash === 617082448);
      },
      ornament(item: D1Item, filterValue: string) {
        const complete = item.talentGrid?.nodes.some((n) => n.ornament);
        const missing = item.talentGrid?.nodes.some((n) => !n.ornament);

        if (filterValue === 'ornamentunlocked') {
          return complete;
        } else if (filterValue === 'ornamentmissing') {
          return missing;
        } else {
          return complete || missing;
        }
      },
      untracked(item: DimItem) {
        return item.trackable && !item.tracked;
      },
      tracked(item: DimItem) {
        return item.trackable && item.tracked;
      },
      unlocked(item: DimItem) {
        return !item.locked;
      },
      locked(item: DimItem) {
        return item.locked;
      },
      masterworked(item: DimItem) {
        return item.masterwork;
      },
      maxpower(item: DimItem) {
        if (!_maxPowerLoadoutItems.length) {
          stores.forEach((store) => {
            _maxPowerLoadoutItems.push(
              ...maxLightItemSet(stores, store).unrestricted.map((i) => i.id)
            );
          });
        }

        return _maxPowerLoadoutItems.includes(item.id);
      },
      /** looks for a loadout (simultaneously equippable) maximized for this stat */
      maxstatloadout(item: D2Item, filterValue: string) {
        // filterValue stat must exist, and this must be armor
        const maxStatHash = statHashByName[filterValue];
        if (!maxStatHash || !item.bucket.inArmor) {
          return false;
        }
        if (!_maxStatLoadoutItems[filterValue]) {
          _maxStatLoadoutItems[filterValue] = [];
        }
        if (!_maxStatLoadoutItems[filterValue].length) {
          stores.forEach((store) => {
            _maxStatLoadoutItems[filterValue].push(
              ...maxStatLoadout(maxStatHash, stores, store).items.map((i) => i.id)
            );
          });
        }

        return _maxStatLoadoutItems[filterValue].includes(item.id);
      },

      /** purer search than above, for highest stats ignoring equippability. includes tied 1st places */
      maxstatvalue(item: D2Item, filterValue: string, byBaseValue = false) {
        gatherHighestStatsPerSlot();
        // filterValue stat must exist, and this must be armor
        if (!item.bucket.inArmor || !item.isDestiny2() || !item.stats || !_maxStatValues) {
          return false;
        }
        const statHashes: number[] =
          filterValue === 'any' ? armorStatHashes : [statHashByName[filterValue]];
        const byWhichValue = byBaseValue ? 'base' : 'value';
        const itemSlot = `${item.classType}${item.type}`;

        const matchingStats = item.stats?.filter(
          (s) =>
            statHashes.includes(s.statHash) &&
            s[byWhichValue] === _maxStatValues![itemSlot][s.statHash][byWhichValue]
        );

        return matchingStats && Boolean(matchingStats.length);
      },
      maxbasestatvalue(item: D2Item, filterValue: string) {
        return this.maxstatvalue(item, filterValue, true);
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
        const dupeId = makeDupeID(item);
        // We filter out the InventoryItem "Default Shader" because everybody has one per character
        return (
          _duplicates &&
          !item.itemCategoryHashes.includes(ItemCategoryHashes.ClanBanner) &&
          item.hash !== DEFAULT_SHADER &&
          item.bucket.hash !== SEASONAL_ARTIFACT_BUCKET &&
          _duplicates[dupeId] &&
          _duplicates[dupeId].length > 1
        );
      },
      seasonaldupe(item: DimItem) {
        initDupes();
        const dupeId = makeSeasonalDupeID(item);
        // We filter out the InventoryItem "Default Shader" because everybody has one per character
        return (
          _duplicates_seasonal &&
          !item.itemCategoryHashes.includes(ItemCategoryHashes.ClanBanner) &&
          item.hash !== DEFAULT_SHADER &&
          item.bucket.hash !== SEASONAL_ARTIFACT_BUCKET &&
          _duplicates_seasonal[dupeId] &&
          _duplicates_seasonal[dupeId].length > 1
        );
      },
      count(item: DimItem, filterValue: string) {
        initDupes();
        const dupeId = makeDupeID(item);
        return (
          _duplicates &&
          compareByOperator(_duplicates[dupeId] ? _duplicates[dupeId].length : 0, filterValue)
        );
      },
      owner(item: DimItem, filterValue: string) {
        let desiredStore = '';
        switch (filterValue) {
          case 'invault':
            desiredStore = 'vault';
            break;
          case 'incurrentchar': {
            if (currentStore) {
              desiredStore = currentStore.id;
            } else {
              return false;
            }
          }
        }
        return item.owner === desiredStore;
      },
      location(item: DimItem, filterValue: string) {
        let storeIndex = 0;

        switch (filterValue) {
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

        return item.bucket.accountWide && !item.location.inPostmaster
          ? item.owner !== 'vault'
          : item.owner === stores[storeIndex].id;
      },
      onwrongclass(item: DimItem) {
        const ownerStore = getStore(stores, item.owner);

        return (
          !item.classified &&
          item.owner !== 'vault' &&
          !item.bucket.accountWide &&
          item.classType !== DestinyClass.Unknown &&
          ownerStore &&
          !item.canBeEquippedBy(ownerStore) &&
          !item.location?.inPostmaster
        );
      },
      classType(item: DimItem, filterValue: string) {
        const classes = ['titan', 'hunter', 'warlock'];
        if (item.classified) {
          return false;
        }

        return item.classType === classes.indexOf(filterValue);
      },
      glimmer(item: DimItem, filterValue: string) {
        switch (filterValue) {
          case 'glimmerboost':
            return boosts.includes(item.hash);
          case 'glimmersupply':
            return supplies.includes(item.hash);
          case 'glimmeritem':
            return boosts.includes(item.hash) || supplies.includes(item.hash);
        }
        return false;
      },
      tag(item: DimItem, filterValue: string) {
        const tag = getTag(item, itemInfos, itemHashTags);
        return (tag || 'none') === filterValue;
      },
      notes(item: DimItem, filterValue: string) {
        const notes = getNotes(item, itemInfos, itemHashTags);
        return notes?.toLocaleLowerCase().includes(filterValue);
      },
      hasnotes(item: DimItem) {
        return Boolean(getNotes(item, itemInfos, itemHashTags));
      },
      stattype(item: DimItem, filterValue: string) {
        return item.stats?.some((s) =>
          Boolean(s.displayProperties.name.toLowerCase() === filterValue && s.value > 0)
        );
      },
      stackable(item: DimItem) {
        return item.maxStackSize > 1;
      },
      stack(item: DimItem, filterValue: string) {
        return compareByOperator(item.amount, filterValue);
      },
      engram(item: DimItem) {
        return item.isEngram;
      },
      infusable(item: DimItem) {
        return item.infusable;
      },
      categoryHash(item: D2Item, filterValue: string) {
        const categoryHash = searchConfig.categoryHashFilters[filterValue.replace(/\s/g, '')];

        if (!categoryHash) {
          return false;
        }
        return item.itemCategoryHashes.includes(categoryHash);
      },
      keyword(item: DimItem, filterValue: string) {
        return (
          this.name(item, filterValue) ||
          this.description(item, filterValue) ||
          this.notes(item, filterValue) ||
          item.typeName.toLowerCase().includes(filterValue) ||
          this.perk(item, filterValue)
        );
      },
      // name and description searches since sometimes "keyword" picks up too much
      name(item: DimItem, filterValue: string) {
        return plainString(item.name).includes(plainString(filterValue));
      },
      description(item: DimItem, filterValue: string) {
        return item.description.toLowerCase().includes(filterValue);
      },
      perk(item: DimItem, filterValue: string) {
        const regex = startWordRegexp(filterValue);
        return (
          item.talentGrid?.nodes.some(
            (node) => regex.test(node.name) || regex.test(node.description)
          ) ||
          (item.isDestiny2() &&
            item.sockets &&
            item.sockets.allSockets.some((socket) =>
              socket.plugOptions.some(
                (plug) =>
                  regex.test(plug.plugDef.displayProperties.name) ||
                  regex.test(plug.plugDef.displayProperties.description) ||
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
      perkname(item: DimItem, filterValue: string) {
        const regex = startWordRegexp(filterValue);
        return (
          item.talentGrid?.nodes.some((node) => regex.test(node.name)) ||
          (item.isDestiny2() &&
            item.sockets &&
            item.sockets.allSockets.some((socket) =>
              socket.plugOptions.some(
                (plug) =>
                  regex.test(plug.plugDef.displayProperties.name) ||
                  plug.perks.some((perk) =>
                    Boolean(perk.displayProperties.name && regex.test(perk.displayProperties.name))
                  )
              )
            ))
        );
      },
      modslot(item: DimItem, filterValue: string) {
        const modSocketTypeHash = getSpecialtySocketMetadata(item);
        return (
          (filterValue === 'none' && !modSocketTypeHash) ||
          (modSocketTypeHash && (filterValue === 'any' || modSocketTypeHash.tag === filterValue))
        );
      },
      holdsmod(item: DimItem, filterValue: string) {
        const modSocketTypeHash = getSpecialtySocketMetadata(item);
        return (
          (filterValue === 'none' && !modSocketTypeHash) ||
          (modSocketTypeHash &&
            (filterValue === 'any' || modSocketTypeHash.compatibleTags.includes(filterValue)))
        );
      },
      powerfulreward(item: D2Item) {
        return item.pursuit?.rewards.some((r) => powerfulSources.includes(r.itemHash));
      },
      light(item: DimItem, filterValue: string) {
        if (!item.primStat) {
          return false;
        }
        return compareByOperator(item.primStat.value, filterValue);
      },
      masterwork(item: D2Item, filterValue: string) {
        if (!item.masterworkInfo) {
          return false;
        }
        if (mathCheck.test(filterValue)) {
          return compareByOperator(
            item.masterworkInfo.tier && item.masterworkInfo.tier < 11
              ? item.masterworkInfo.tier
              : 10,
            filterValue
          );
        }
        return item.masterworkInfo?.stats?.some((s) => s.hash === statHashByName?.[filterValue]);
      },
      season(item: D2Item, filterValue: string) {
        return compareByOperator(item.season, filterValue);
      },
      year(item: DimItem, filterValue: string) {
        if (item.isDestiny1()) {
          return compareByOperator(item.year, filterValue);
        } else if (item.isDestiny2()) {
          return compareByOperator(D2SeasonInfo[item.season]?.year, filterValue);
        }
      },
      level(item: DimItem, filterValue: string) {
        return compareByOperator(item.equipRequiredLevel, filterValue);
      },
      energycapacity(item: D2Item, filterValue: string) {
        if (item.energy) {
          return (
            (mathCheck.test(filterValue) &&
              compareByOperator(item.energy.energyCapacity, filterValue)) ||
            filterValue === energyNamesByEnum[item.energy.energyType]
          );
        }
      },
      breaker(item: D2Item, filterValue: string) {
        if (item.breakerType) {
          return breakerTypes[filterValue] === item.breakerType.hash;
        }
      },
      hascapacity(item: D2Item) {
        return Boolean(item.energy);
      },
      powerlimit(item: D2Item, filterValue: string) {
        // anything with no powerCap has no known limit, so treat it like it's 99999999
        return compareByOperator(item.powerCap ?? 99999999, filterValue);
      },
      sunsetsafter(item: D2Item, filterValue: string) {
        const itemFinalSeason = getItemPowerCapFinalSeason(item);
        return itemFinalSeason && compareByOperator(itemFinalSeason, filterValue);
      },
      quality(item: D1Item, filterValue: string) {
        if (!item.quality) {
          return false;
        }
        return compareByOperator(item.quality.min, filterValue);
      },
      hasRating(item: DimItem, filterValue: string) {
        if ($featureFlags.reviewsEnabled) {
          const dtrRating = getRating(item, ratings);
          return filterValue.length !== 0 && dtrRating?.overallScore;
        }
      },
      randomroll(item: D2Item) {
        return (
          Boolean(item.energy) || item.sockets?.allSockets.some((s) => s.hasRandomizedPlugItems)
        );
      },
      rating(item: DimItem, filterValue: string) {
        if ($featureFlags.reviewsEnabled) {
          const dtrRating = getRating(item, ratings);
          const showRating = dtrRating && shouldShowRating(dtrRating) && dtrRating.overallScore;
          return showRating && compareByOperator(dtrRating?.overallScore, filterValue);
        }
      },
      ratingcount(item: DimItem, filterValue: string) {
        if ($featureFlags.reviewsEnabled) {
          const dtrRating = getRating(item, ratings);
          return dtrRating?.ratingCount && compareByOperator(dtrRating.ratingCount, filterValue);
        }
      },
      vendor(item: D1Item, filterValue: string) {
        if (!item) {
          return false;
        }
        if (vendorHashes.restricted[filterValue]) {
          return (
            vendorHashes.required[filterValue].some((vendorHash) =>
              item.sourceHashes.includes(vendorHash)
            ) &&
            !vendorHashes.restricted[filterValue].some((vendorHash) =>
              item.sourceHashes.includes(vendorHash)
            )
          );
        } else {
          return vendorHashes.required[filterValue].some((vendorHash) =>
            item.sourceHashes.includes(vendorHash)
          );
        }
      },
      source(item: D2Item, filterValue: string) {
        if (!item && (!D2Sources[filterValue] || !D2EventPredicateLookup[filterValue])) {
          return false;
        }
        if (D2Sources[filterValue]) {
          return (
            (item.source && D2Sources[filterValue].sourceHashes.includes(item.source)) ||
            D2Sources[filterValue].itemHashes.includes(item.hash) ||
            missingSources[filterValue]?.includes(item.hash)
          );
        } else if (D2EventPredicateLookup[filterValue]) {
          return D2EventPredicateLookup[filterValue] === item?.event;
        }
        return false;
      },
      activity(item: D1Item, filterValue: string) {
        if (!item) {
          return false;
        }
        if (filterValue === 'vanilla') {
          return item.year === 1;
        } else if (D1ActivityHashes.restricted[filterValue]) {
          return (
            D1ActivityHashes.required[filterValue].some((sourceHash) =>
              item.sourceHashes.includes(sourceHash)
            ) &&
            !D1ActivityHashes.restricted[filterValue].some((sourceHash) =>
              item.sourceHashes.includes(sourceHash)
            )
          );
        } else {
          return D1ActivityHashes.required[filterValue].some((sourceHash) =>
            item.sourceHashes.includes(sourceHash)
          );
        }
      },
      inloadout(item: DimItem) {
        // Lazy load loadouts and re-trigger
        if (!_loadoutItemIds) {
          _loadoutItemIds = new Set<string>();
          for (const loadout of loadouts) {
            for (const item of loadout.items) {
              if (item.id && item.id !== '0') {
                _loadoutItemIds.add(item.id);
              }
            }
          }
        }

        return _loadoutItemIds?.has(item.id);
      },
      new(item: DimItem) {
        return newItems.has(item.id);
      },
      tagged(item: DimItem) {
        return Boolean(getTag(item, itemInfos, itemHashTags));
      },
      hasLight(item: DimItem) {
        return item.primStat && lightStats.includes(item.primStat.statHash);
      },
      curated(item: D2Item) {
        if (!item) {
          return false;
        }

        // TODO: remove if there are no false positives, as this precludes maintaining a list for curatedNonMasterwork
        // const masterWork = item.masterworkInfo?.statValue === 10;
        // const curatedNonMasterwork = [792755504, 3356526253, 2034817450].includes(item.hash); // Nightshade, Wishbringer, Distant Relation

        const legendaryWeapon =
          item.bucket?.sort === 'Weapons' && item.tier.toLowerCase() === 'legendary';

        const oneSocketPerPlug = item.sockets?.allSockets
          .filter((socket) =>
            curatedPlugsAllowList.includes(socket?.plugged?.plugDef?.plug?.plugCategoryHash || 0)
          )
          .every((socket) => socket?.plugOptions.length === 1);

        return (
          legendaryWeapon &&
          // (masterWork || curatedNonMasterwork) && // checks for masterWork(10) or on curatedNonMasterWork list
          oneSocketPerPlug
        );
      },
      weapon(item: DimItem) {
        return (
          item.bucket?.sort === 'Weapons' &&
          item.bucket.type !== 'SeasonalArtifacts' &&
          item.bucket.type !== 'Class'
        );
      },
      armor(item: DimItem) {
        return item.bucket?.sort === 'Armor';
      },
      cosmetic(item: DimItem) {
        return cosmeticTypes.includes(item.type);
      },
      equipment(item: DimItem) {
        return item.equipment;
      },
      postmaster(item: DimItem) {
        return item.location?.inPostmaster;
      },
      equipped(item: DimItem) {
        return item.equipped;
      },
      transferable(item: DimItem) {
        return !item.notransfer;
      },
      hasShader(item: D2Item) {
        return item.sockets?.allSockets.some((socket) =>
          Boolean(
            socket.plugged?.plugDef.plug &&
              socket.plugged.plugDef.plug.plugCategoryHash === SHADERS_BUCKET &&
              socket.plugged.plugDef.hash !== DEFAULT_SHADER
          )
        );
      },
      hasOrnament(item: D2Item) {
        return item.sockets?.allSockets.some((socket) =>
          Boolean(
            socket.plugged &&
              socket.plugged.plugDef.itemSubType === DestinyItemSubType.Ornament &&
              socket.plugged.plugDef.hash !== DEFAULT_GLOW &&
              !DEFAULT_ORNAMENTS.includes(socket.plugged.plugDef.hash) &&
              !socket.plugged.plugDef.itemCategoryHashes?.includes(
                ItemCategoryHashes.ArmorModsGlowEffects
              )
          )
        );
      },
      hasMod(item: D2Item) {
        return item.sockets?.allSockets.some((socket) =>
          Boolean(
            socket.plugged &&
              !emptySocketHashes.includes(socket.plugged.plugDef.hash) &&
              socket.plugged.plugDef.plug &&
              socket.plugged.plugDef.plug.plugCategoryIdentifier.match(
                /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/
              ) &&
              // enforce that this provides a perk (excludes empty slots)
              socket.plugged.plugDef.perks.length &&
              // enforce that this doesn't have an energy cost (y3 reusables)
              !socket.plugged.plugDef.plug.energyCost
          )
        );
      },
      modded(item: D2Item) {
        return (
          Boolean(item.energy) &&
          item.sockets &&
          item.sockets.allSockets.some((socket) =>
            Boolean(
              socket.plugged &&
                !emptySocketHashes.includes(socket.plugged.plugDef.hash) &&
                socket.plugged.plugDef.plug &&
                socket.plugged.plugDef.plug.plugCategoryIdentifier.match(
                  /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/
                ) &&
                // enforce that this provides a perk (excludes empty slots)
                socket.plugged.plugDef.perks.length
            )
          )
        );
      },
      trashlist(item: D2Item) {
        return Boolean(inventoryWishListRolls[item.id]?.isUndesirable);
      },
      wishlist(item: D2Item) {
        return Boolean(
          inventoryWishListRolls[item.id] && !inventoryWishListRolls[item.id].isUndesirable
        );
      },
      wishlistdupe(item: D2Item) {
        if (!this.dupe(item) || !_duplicates) {
          return false;
        }
        const dupeId = makeDupeID(item);
        const itemDupes = _duplicates[dupeId];

        return itemDupes.some(this.wishlist);
      },
      wishlistnotes(item: D2Item, filterValue: string) {
        const potentialWishListRoll = inventoryWishListRolls[item.id];

        return (
          Boolean(potentialWishListRoll) &&
          potentialWishListRoll.notes &&
          potentialWishListRoll.notes.toLocaleLowerCase().includes(filterValue)
        );
      },
      ammoType(item: D2Item, filterValue: string) {
        return (
          item.ammoType ===
          {
            primary: DestinyAmmunitionType.Primary,
            special: DestinyAmmunitionType.Special,
            heavy: DestinyAmmunitionType.Heavy,
          }[filterValue]
        );
      },
      // create a stat filter for each stat name
      ...allStatNames.reduce((obj, name) => {
        obj[name] = filterByStats(name, false);
        return obj;
      }, {}),
      // create a basestat filter for each ARMOR stat name
      ...searchableStatNames.reduce((obj, name) => {
        obj[`base${name}`] = filterByStats(name, true);
        return obj;
      }, {}),
    },
  };
}
