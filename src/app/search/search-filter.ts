import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { customStatsSelector, languageSelector } from 'app/dim-api/selectors';
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
import { FilterContext, ItemFilter } from './filter-types';
import { parseQuery, QueryAST } from './query-parser';
import { SearchConfig, searchConfigSelector } from './search-config';
import { parseAndValidateQuery } from './search-utils';

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
  customStats: Settings['customTotalStatsByClass']
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
          return fns.length
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
          return fns.length
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

          // "is:" filters are slightly special cased
          const filterDef = filterName === 'is' ? isFilters[filterValue] : kvFilters[filterName];

          if (filterDef) {
            // Each filter knows how to generate a standalone item filter function
            try {
              return filterDef.filter({ filterValue, ...filterContext });
            } catch (e) {
              // TODO: mark invalid - fill out what didn't make sense and where it was in the string
              errorLog('search', 'Invalid query term', filterName, filterValue, e);
              return undefined;
            }
          }

          // TODO: mark invalid - fill out what didn't make sense and where it was in the string
          return undefined;
        }
        case 'noop':
          return undefined;
      }
    };

    return transformAST(parsedQuery) ?? (() => true);
  };
}
