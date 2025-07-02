import { CustomStatDef, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { customStatsSelector, languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  allNotesHashtagsSelector,
  currentStoreSelector,
  displayableBucketHashesSelector,
  getNotesSelector,
  getTagSelector,
  newItemsSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutsSelector } from 'app/loadout/loadouts-selector';
import { LoadoutsByItem, loadoutsByItemSelector } from 'app/loadout/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { buildFiltersMap, buildSearchConfig } from 'app/search/search-config';
import { makeSearchFilterFactory, parseAndValidateQuery } from 'app/search/search-filter';
import { Settings } from 'app/settings/initial-settings';
import { querySelector } from 'app/shell/selectors';
import { wishListFunctionSelector, wishListsByHashSelector } from 'app/wishlists/selectors';
import { WishListRoll } from 'app/wishlists/types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import memoizeOne from 'memoize-one';
import { createSelector } from 'reselect';
import { FilterContext, SuggestionsContext } from './item-filter-types';
import advancedFilters from './search-filters/advanced';
import d1Filters from './search-filters/d1-filters';
import dupeFilters from './search-filters/dupes';
import freeformFilters from './search-filters/freeform';
import itemInfosFilters from './search-filters/item-infos';
import knownValuesFilters from './search-filters/known-values';
import loadoutFilters from './search-filters/loadouts';
import simpleRangeFilters from './search-filters/range-numeric';
import overloadedRangeFilters from './search-filters/range-overload';
import simpleFilters from './search-filters/simple';
import socketFilters from './search-filters/sockets';
import statFilters from './search-filters/stats';
import locationFilters from './search-filters/stores';
import wishlistFilters from './search-filters/wishlist';

const allFilters = [
  ...dupeFilters,
  ...($featureFlags.wishLists ? wishlistFilters : []),
  ...freeformFilters,
  ...itemInfosFilters,
  ...knownValuesFilters,
  ...d1Filters,
  ...loadoutFilters,
  ...simpleRangeFilters,
  ...overloadedRangeFilters,
  ...simpleFilters,
  ...socketFilters,
  ...statFilters,
  ...locationFilters,
  ...advancedFilters,
];

export const buildItemFiltersMap = memoizeOne((destinyVersion: DestinyVersion) =>
  buildFiltersMap(destinyVersion, allFilters),
);

export function buildItemSearchConfig(
  destinyVersion: DestinyVersion,
  language: DimLanguage,
  suggestionsContext: SuggestionsContext = {},
) {
  const filtersMap = buildItemFiltersMap(destinyVersion);
  return buildSearchConfig(language, suggestionsContext, filtersMap);
}

//
// Selectors
//

/**
 * A selector for the suggestionsContext for a particular destiny version.
 * This must depend on every bit of data in suggestionsContext so that we
 * regenerate filter suggestions whenever any of them changes.
 */
export const suggestionsContextSelector = createSelector(
  allItemsSelector,
  loadoutsSelector,
  d2ManifestSelector,
  getTagSelector,
  getNotesSelector,
  allNotesHashtagsSelector,
  customStatsSelector,
  makeSuggestionsContext,
);

function makeSuggestionsContext(
  allItems: DimItem[],
  loadouts: Loadout[],
  d2Definitions: D2ManifestDefinitions | undefined,
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  allNotesHashtags: string[],
  customStats: CustomStatDef[],
): SuggestionsContext {
  return {
    allItems,
    loadouts,
    d2Definitions,
    getTag,
    getNotes,
    allNotesHashtags,
    customStats,
  };
}

export const searchConfigSelector = createSelector(
  destinyVersionSelector,
  languageSelector,
  suggestionsContextSelector,
  buildItemSearchConfig,
);

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
