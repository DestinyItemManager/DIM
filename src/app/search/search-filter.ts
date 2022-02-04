import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { customStatsSelector, languageSelector } from 'app/dim-api/selectors';
import { Settings } from 'app/settings/initial-settings';
import { RootState } from 'app/store/types';
import { errorLog } from 'app/utils/log';
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
  sortedStoresSelector,
} from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { Loadout } from '../loadout-drawer/loadout-types';
import { loadoutsSelector } from '../loadout-drawer/selectors';
import { querySelector } from '../shell/selectors';
import { wishListFunctionSelector } from '../wishlists/selectors';
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
  loadoutsSelector,
  wishListFunctionSelector,
  (state: RootState) => state.inventory.newItems,
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

/** A selector for a function for searching items, given the current search query. */
export const validateQuerySelector = createSelector(
  searchConfigSelector,
  (searchConfig) => (query: string) => parseAndValidateQuery(query, searchConfig)
);

function makeSearchFilterFactory(
  { filters }: SearchConfig,
  stores: DimStore[],
  allItems: DimItem[],
  currentStore: DimStore,
  loadouts: Loadout[],
  wishListFunction: (item: DimItem) => InventoryWishListRoll | undefined,
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
    loadouts,
    wishListFunction,
    newItems,
    itemInfos,
    itemHashTags,
    language,
    customStats,
  };

  return (query: string): ItemFilter => {
    query = query.trim().toLowerCase();
    if (!query.length) {
      // By default, show anything that doesn't have the archive tag
      return _.stubTrue;
    }

    const parsedQuery = parseQuery(query);

    // Transform our query syntax tree into a filter function by recursion.
    const transformAST = (ast: QueryAST): ItemFilter => {
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
          const filterName = ast.type;
          const filterValue = ast.args;

          // "is:" filters are slightly special cased
          if (filterName === 'is') {
            const filterDef = filters[filterValue];
            if (filterDef && canonicalFilterFormats(filterDef.format).some((f) => f === 'simple')) {
              try {
                return filterDef.filter({ keyword: filterName, filterValue, ...filterContext });
              } catch (e) {
                // An `is` filter really shouldn't throw an error on filter construction...
                errorLog(
                  'search',
                  'internal error: simple is filter threw exception?',
                  filterName,
                  filterValue,
                  e
                );
                return () => true;
              }
            }
          } else {
            const filterDef = filters[filterName];
            if (filterDef) {
              const matchedFilter = matchFilter(filterDef, filterName, filterValue);
              if (matchedFilter) {
                try {
                  return matchedFilter(filterContext);
                } catch (e) {
                  // This shouldn't happen because it means validation wouldn't catch it, but
                  // not the end of the world...
                  errorLog(
                    'search',
                    'internal error: filter construction threw exception',
                    filterName,
                    filterValue,
                    e
                  );
                  return () => true;
                }
              } else {
                // TODO: mark invalid - fill out what didn't make sense and where it was in the string
                return () => true;
              }
            }
          }

          // TODO: mark invalid - fill out what didn't make sense and where it was in the string
          return () => true;
        }
        case 'noop':
          return () => true;
      }
    };

    return transformAST(parsedQuery);
  };
}

/** Matches a non-`is` filter syntax and returns a way to actually create the matched filter function. */
export function matchFilter(
  filterDef: FilterDefinition,
  keyword: string,
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
              keyword,
              filterValue,
              ...filterContext,
            });
        } else {
          break;
        }
      }
      case 'freeform': {
        return (filterContext) => filterDef.filter({ keyword, filterValue, ...filterContext });
      }
      case 'range': {
        try {
          const compare = rangeStringToComparator(filterValue, filterDef.overload);
          return (filterContext) =>
            filterDef.filter({
              keyword,
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
                keyword,
                filterValue: stat,
                compare,
                ...filterContext,
              });
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
