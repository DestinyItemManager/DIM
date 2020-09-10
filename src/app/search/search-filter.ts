import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { RootState } from 'app/store/types';
import { emptyObject } from 'app/utils/empty';
import { createSelector } from 'reselect';
import { getTag, ItemInfos } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import {
  currentStoreSelector,
  itemHashTagsSelector,
  itemInfosSelector,
  sortedStoresSelector,
} from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { ratingsSelector, ReviewsState } from '../item-review/reducer';
import { Loadout } from '../loadout/loadout-types';
import { loadoutsSelector } from '../loadout/reducer';
import { querySelector } from '../shell/reducer';
import { inventoryWishListsSelector } from '../wishlists/reducer';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import { FilterContext, ItemFilter } from './filter-types';
import { parseQuery, QueryAST } from './query-parser';
import { SearchConfig, searchConfigSelector } from './search-config';

//
// Selectors
//

/**
 * A selector for the search config for a particular destiny version. This must
 * depend on every bit of data in FilterContext so that we regenerate the filter
 * function whenever any of them changes.
 */
export const searchFiltersConfigSelector = createSelector(
  searchConfigSelector,
  sortedStoresSelector,
  currentStoreSelector,
  loadoutsSelector,
  inventoryWishListsSelector,
  $featureFlags.reviewsEnabled ? ratingsSelector : emptyObject,
  (state: RootState) => state.inventory.newItems,
  itemInfosSelector,
  itemHashTagsSelector,
  makeSearchFilterFactory
);

/** A selector for a function for searching items, given the current search query. */
export const searchFilterSelector = createSelector(
  querySelector,
  searchFiltersConfigSelector,
  (query, filterFactory) => filterFactory(query)
);

function makeSearchFilterFactory(
  { filters }: SearchConfig,
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
) {
  const filterContext: FilterContext = {
    stores,
    currentStore,
    loadouts,
    inventoryWishListRolls,
    ratings,
    newItems,
    itemInfos,
    itemHashTags,
  };

  return (query: string): ItemFilter => {
    query = query.trim().toLowerCase();
    if (!query.length) {
      // By default, show anything that doesn't have the archive tag
      return (item: DimItem) => getTag(item, itemInfos, itemHashTags) !== 'archive';
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
          const { type: filterName, args: filterValue } = ast;

          const filterDef = filters[filterName];
          if (filterDef) {
            // Each filter knows how to generate a standalone item filter function
            // TODO: allow the filter generator to throw an error
            return filterDef.filter({ filterValue, ...filterContext });
          }

          // TODO: mark invalid - fill out what didn't make sense and where it was in the string
          return () => true;
        }
      }

      return () => true;
    };

    return transformAST(parsedQuery);
  };
}
