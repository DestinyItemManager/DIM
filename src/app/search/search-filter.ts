import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { customStatsSelector, languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { TagValue } from 'app/inventory/dim-item-info';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { Settings } from 'app/settings/initial-settings';
import { errorLog } from 'app/utils/log';
import { WishListRoll } from 'app/wishlists/types';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { DimItem } from '../inventory/item-types';
import {
  allItemsSelector,
  currentStoreSelector,
  displayableBucketHashesSelector,
  getNotesSelector,
  getTagSelector,
  newItemsSelector,
  sortedStoresSelector,
} from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { LoadoutsByItem, loadoutsByItemSelector } from '../loadout-drawer/selectors';
import { querySelector } from '../shell/selectors';
import { wishListFunctionSelector, wishListsByHashSelector } from '../wishlists/selectors';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import {
  FilterContext,
  FilterDefinition,
  ItemFilter,
  canonicalFilterFormats,
} from './filter-types';
import { QueryAST, parseQuery } from './query-parser';
import { SearchConfig, searchConfigSelector } from './search-config';
import { parseAndValidateQuery, rangeStringToComparator } from './search-utils';

//
// Selectors
//

/**
 * A selector for the filterContext for a particular destiny version. This must
 * depend on every bit of data a filter might need to run, so that we regenerate the filter
 * functions whenever any of them changes.
 */
export const filterContextSelector = createSelector(
  sortedStoresSelector,
  allItemsSelector,
  currentStoreSelector,
  loadoutsByItemSelector,
  wishListFunctionSelector,
  wishListsByHashSelector,
  newItemsSelector,
  getTagSelector,
  getNotesSelector,
  languageSelector,
  customStatsSelector,
  d2ManifestSelector,
  makeFilterContext
);

function makeFilterContext(
  stores: DimStore[],
  allItems: DimItem[],
  currentStore: DimStore | undefined,
  loadoutsByItem: LoadoutsByItem,
  wishListFunction: (item: DimItem) => InventoryWishListRoll | undefined,
  wishListsByHash: _.Dictionary<WishListRoll[]>,
  newItems: Set<string>,
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  language: DimLanguage,
  customStats: Settings['customStats'],
  d2Definitions: D2ManifestDefinitions | undefined
): FilterContext {
  return {
    stores,
    allItems,
    currentStore: currentStore!,
    loadoutsByItem,
    wishListFunction,
    newItems,
    getTag,
    getNotes,
    language,
    customStats,
    wishListsByHash,
    d2Definitions,
  };
}

/**
 * A selector for the search config for a particular destiny version.
 * Combines the searchConfig (list of filters),
 * and the filterContext (list of other stat information filters can use)
 * into a filter factory (for converting parsed strings into filter functions)
 */
export const filterFactorySelector = createSelector(
  searchConfigSelector,
  filterContextSelector,
  makeSearchFilterFactory
);

/** A selector for a function for searching items, given the current search query. */
export const searchFilterSelector = createSelector(
  querySelector,
  filterFactorySelector,
  (query, filterFactory) => filterFactory(query)
);

/** A selector for all items filtered by whatever's currently in the search box. */
export const filteredItemsSelector = createSelector(
  allItemsSelector,
  searchFilterSelector,
  displayableBucketHashesSelector,
  (allItems, searchFilter, displayableBuckets) =>
    allItems.filter((i) => displayableBuckets.has(i.location.hash) && searchFilter(i))
);

/** A selector for a function for validating a query. */
export const validateQuerySelector = createSelector(
  searchConfigSelector,
  filterContextSelector,
  (searchConfig, filterContext) => (query: string) =>
    parseAndValidateQuery(query, searchConfig.filtersMap, filterContext)
);

/** Whether the current search query is valid. */
export const queryValidSelector = createSelector(
  querySelector,
  validateQuerySelector,
  (query, validateQuery) => validateQuery(query).valid
);

function makeSearchFilterFactory(
  { filtersMap: { isFilters, kvFilters } }: SearchConfig,
  filterContext: FilterContext
) {
  return (query: string): ItemFilter => {
    query = query.trim().toLowerCase();
    if (!query.length) {
      // By default, show anything that doesn't have the archive tag
      return _.stubTrue;
    }

    const parsedQuery = parseQuery(query);

    // Transform our query syntax tree into a filter function by recursion.
    const transformAST = (ast: QueryAST): ItemFilter | undefined => {
      switch (ast.op) {
        case 'and': {
          const fns = _.compact(ast.operands.map(transformAST));
          // Propagate filter errors
          return fns.length === ast.operands.length
            ? (item) => {
                for (const fn of fns) {
                  if (!fn(item)) {
                    return false;
                  }
                }
                return true;
              }
            : undefined;
        }
        case 'or': {
          const fns = _.compact(ast.operands.map(transformAST));
          // Propagate filter errors
          return fns.length === ast.operands.length
            ? (item) => {
                for (const fn of fns) {
                  if (fn(item)) {
                    return true;
                  }
                }
                return false;
              }
            : undefined;
        }
        case 'not': {
          const fn = transformAST(ast.operand);
          return fn && ((item) => !fn(item));
        }
        case 'filter': {
          const filterName = ast.type;
          const filterValue = ast.args;

          if (filterName === 'is') {
            // "is:" filters are slightly special cased
            const filterDef = isFilters[filterValue];
            if (filterDef) {
              try {
                return filterDef.filter({ lhs: filterName, filterValue, ...filterContext });
              } catch (e) {
                // An `is` filter really shouldn't throw an error on filter construction...
                errorLog(
                  'search',
                  'internal error: filter construction threw exception',
                  filterName,
                  filterValue,
                  e
                );
              }
            }
            return undefined;
          } else {
            const filterDef = kvFilters[filterName];
            const matchedFilter =
              filterDef && matchFilter(filterDef, filterName, filterValue, filterContext);
            if (matchedFilter) {
              try {
                return matchedFilter(filterContext);
              } catch (e) {
                // If this happens, a filter declares more syntax valid than it actually accepts, which
                // is a bug in the filter declaration.
                errorLog(
                  'search',
                  'internal error: filter construction threw exception',
                  filterName,
                  filterValue,
                  e
                );
              }
            }
            return undefined;
          }
        }
        case 'noop':
          return undefined;
      }
    };

    // If our filter has any invalid parts, the search filter should match no items
    return transformAST(parsedQuery) ?? (() => false);
  };
}

/** Matches a non-`is` filter syntax and returns a way to actually create the matched filter function. */
export function matchFilter(
  filterDef: FilterDefinition,
  lhs: string,
  filterValue: string,
  currentFilterContext?: FilterContext
): ((args: FilterContext) => ItemFilter) | undefined {
  for (const format of canonicalFilterFormats(filterDef.format)) {
    switch (format) {
      case 'simple': {
        break;
      }
      case 'query': {
        if (filterDef.suggestions!.includes(filterValue)) {
          return (filterContext) =>
            filterDef.filter({
              lhs,
              filterValue,
              ...filterContext,
            });
        } else {
          break;
        }
      }
      case 'freeform': {
        return (filterContext) => filterDef.filter({ lhs, filterValue, ...filterContext });
      }
      case 'range': {
        try {
          const compare = rangeStringToComparator(filterValue, filterDef.overload);
          return (filterContext) =>
            filterDef.filter({
              lhs,
              filterValue: '',
              compare,
              ...filterContext,
            });
        } catch {
          break;
        }
      }
      case 'stat': {
        const [stat, rangeString] = filterValue.split(':', 2);
        try {
          const compare = rangeStringToComparator(rangeString, filterDef.overload);
          const validator = filterDef.validateStat?.(currentFilterContext);
          if (!validator || validator(stat)) {
            return (filterContext) =>
              filterDef.filter({
                lhs,
                filterValue: stat,
                compare,
                ...filterContext,
              });
          } else {
            break;
          }
        } catch {
          break;
        }
      }
      case 'custom':
        break;
    }
  }
}
