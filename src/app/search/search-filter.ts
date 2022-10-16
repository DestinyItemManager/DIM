import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { customStatsSelector, languageSelector } from 'app/dim-api/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { Settings } from 'app/settings/initial-settings';
import { errorLog } from 'app/utils/log';
import { WishListRoll } from 'app/wishlists/types';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { ItemInfos } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import {
  allItemsSelector,
  currentStoreSelector,
  displayableBucketHashesSelector,
  itemHashTagsSelector,
  itemInfosSelector,
  newItemsSelector,
  sortedStoresSelector,
} from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { LoadoutsByItem, loadoutsByItemSelector } from '../loadout-drawer/selectors';
import { querySelector } from '../shell/selectors';
import { wishListFunctionSelector, wishListsByHashSelector } from '../wishlists/selectors';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import {
  canonicalFilterFormats,
  FilterContext,
  FilterDefinition,
  ItemFilter,
} from './filter-types';
import { parseQuery, QueryAST } from './query-parser';
import { SearchConfig, searchConfigSelector } from './search-config';
import { parseAndValidateQuery, rangeStringToComparator } from './search-utils';

//
// Selectors
//

/**
 * A selector for the search config for a particular destiny version. This must
 * depend on every bit of data in FilterContext so that we regenerate the filter
 * function whenever any of them changes.
 */
export const filterFactorySelector = createSelector(
  searchConfigSelector,
  sortedStoresSelector,
  allItemsSelector,
  currentStoreSelector,
  loadoutsByItemSelector,
  wishListFunctionSelector,
  wishListsByHashSelector,
  newItemsSelector,
  itemInfosSelector,
  itemHashTagsSelector,
  languageSelector,
  customStatsSelector,
  d2ManifestSelector,
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
  (searchConfig) => (query: string) => parseAndValidateQuery(query, searchConfig)
);

/** Whether the current search query is valid. */
export const queryValidSelector = createSelector(
  querySelector,
  validateQuerySelector,
  (query, validateQuery) => validateQuery(query).valid
);

function makeSearchFilterFactory(
  { isFilters, kvFilters }: SearchConfig,
  stores: DimStore[],
  allItems: DimItem[],
  currentStore: DimStore,
  loadoutsByItem: LoadoutsByItem,
  wishListFunction: (item: DimItem) => InventoryWishListRoll | undefined,
  wishListsByHash: _.Dictionary<WishListRoll[]>,
  newItems: Set<string>,
  itemInfos: ItemInfos,
  itemHashTags: {
    [itemHash: string]: ItemHashTag;
  },
  language: string,
  customStats: Settings['customTotalStatsByClass'],
  d2Definitions: D2ManifestDefinitions
) {
  const filterContext: FilterContext = {
    stores,
    allItems,
    currentStore,
    loadoutsByItem,
    wishListFunction,
    newItems,
    itemInfos,
    itemHashTags,
    language,
    customStats,
    wishListsByHash,
    d2Definitions,
  };

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
            const matchedFilter = matchFilter(filterDef, filterName, filterValue);
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
  filterValue: string
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
          if (!filterDef.validateStat || filterDef.validateStat(stat)) {
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
