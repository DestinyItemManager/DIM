import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { customStatsSelector, languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { TagValue } from 'app/inventory/dim-item-info';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { Settings } from 'app/settings/initial-settings';
import { WishListRoll } from 'app/wishlists/types';
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
import { FilterContext, SuggestionsContext } from './filter-types';
import { searchConfigSelector } from './item-search-config';
import { makeSearchFilterFactory, parseAndValidateQuery } from './search-filter';

//
// Selectors
//

/**
 * A selector for the filterContext for a particular destiny version. This must
 * depend on every bit of data a filter might need to run, so that we regenerate the filter
 * functions whenever any of them changes.
 */
const filterContextSelector = createSelector(
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
  makeFilterContext,
);

function makeFilterContext(
  stores: DimStore[],
  allItems: DimItem[],
  currentStore: DimStore | undefined,
  loadoutsByItem: LoadoutsByItem,
  wishListFunction: (item: DimItem) => InventoryWishListRoll | undefined,
  wishListsByHash: Map<number, WishListRoll[]>,
  newItems: Set<string>,
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  language: DimLanguage,
  customStats: Settings['customStats'],
  d2Definitions: D2ManifestDefinitions | undefined,
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
  makeSearchFilterFactory<DimItem, FilterContext, SuggestionsContext>,
);

/** A selector for a function for searching items, given the current search query. */
export const searchFilterSelector = createSelector(
  querySelector,
  filterFactorySelector,
  (query, filterFactory) => filterFactory(query),
);

/** A selector for all items filtered by whatever's currently in the search box. */
export const filteredItemsSelector = createSelector(
  allItemsSelector,
  searchFilterSelector,
  displayableBucketHashesSelector,
  (allItems, searchFilter, displayableBuckets) =>
    allItems.filter((i) => displayableBuckets.has(i.location.hash) && searchFilter(i)),
);

/** A selector for a function for validating a query. */
export const validateQuerySelector = createSelector(
  searchConfigSelector,
  filterContextSelector,
  (searchConfig, filterContext) => (query: string) =>
    parseAndValidateQuery(query, searchConfig.filtersMap, filterContext),
);

/** Whether the current search query is valid. */
export const queryValidSelector = createSelector(
  querySelector,
  validateQuerySelector,
  (query, validateQuery) => validateQuery(query).valid,
);
