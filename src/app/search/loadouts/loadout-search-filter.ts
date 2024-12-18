import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutsSelector } from 'app/loadout/loadouts-selector';
import {
  LoadoutsByItem,
  loadoutsByItemSelector,
  selectedLoadoutStoreSelector,
} from 'app/loadout/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { buildFiltersMap, buildSearchConfig } from 'app/search/search-config';
import { makeSearchFilterFactory, parseAndValidateQuery } from 'app/search/search-filter';
import memoizeOne from 'memoize-one';
import { createSelector } from 'reselect';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from './loadout-filter-types';
import freeformFilters from './search-filters/freeform';
import overloadedRangeFilters from './search-filters/range-overload';
import simpleFilters from './search-filters/simple';

const allLoadoutFilters = [...simpleFilters, ...freeformFilters, ...overloadedRangeFilters];

//
// Selectors
//

/**
 * A selector for the suggestionsContext for a particular destiny version.
 * This must depend on every bit of data in suggestionsContext so that we
 * regenerate filter suggestions whenever any of them changes.
 */
export const loadoutSuggestionsContextSelector = createSelector(
  loadoutsSelector,
  selectedLoadoutStoreSelector,
  allItemsSelector,
  d2ManifestSelector,
  makeLoadoutSuggestionsContext,
);

function makeLoadoutSuggestionsContext(
  loadouts: Loadout[],
  selectedLoadoutsStore: DimStore,
  allItems: DimItem[],
  d2Definitions: D2ManifestDefinitions | undefined,
): LoadoutSuggestionsContext {
  return {
    loadouts,
    selectedLoadoutsStore,
    allItems,
    d2Definitions,
  };
}

export const loadoutSearchConfigSelector = createSelector(
  destinyVersionSelector,
  languageSelector,
  loadoutSuggestionsContextSelector,
  buildLoadoutsSearchConfig,
);

function makeLoadoutFilterContext(
  selectedLoadoutsStore: DimStore,
  loadoutsByItem: LoadoutsByItem,
  language: DimLanguage,
  allItems: DimItem[],
  d2Definitions: D2ManifestDefinitions | undefined,
): LoadoutFilterContext {
  return {
    selectedLoadoutsStore,
    loadoutsByItem,
    language,
    allItems,
    d2Definitions,
  };
}

/**
 * A selector for the filterContext for a particular destiny version. This must
 * depend on every bit of data a filter might need to run, so that we regenerate the filter
 * functions whenever any of them changes.
 */
const loadoutFilterContextSelector = createSelector(
  selectedLoadoutStoreSelector,
  loadoutsByItemSelector,
  languageSelector,
  allItemsSelector,
  d2ManifestSelector,
  makeLoadoutFilterContext,
);

/**
 * A selector for the search config for a particular destiny version.
 * Combines the searchConfig (list of filters),
 * and the filterContext (list of other stat information filters can use)
 * into a filter factory (for converting parsed strings into filter functions)
 */
export const loadoutFilterFactorySelector = createSelector(
  loadoutSearchConfigSelector,
  loadoutFilterContextSelector,
  makeSearchFilterFactory,
);

/** A selector for a function for validating a query. */
export const validateLoadoutQuerySelector = createSelector(
  loadoutSearchConfigSelector,
  loadoutFilterContextSelector,
  (searchConfig, filterContext) => (query: string) =>
    parseAndValidateQuery(query, searchConfig.filtersMap, filterContext),
);

export const buildLoadoutsFiltersMap = memoizeOne((destinyVersion: DestinyVersion) =>
  buildFiltersMap(destinyVersion, allLoadoutFilters),
);

function buildLoadoutsSearchConfig(
  destinyVersion: DestinyVersion,
  language: DimLanguage,
  suggestionsContext: LoadoutSuggestionsContext,
) {
  const filtersMap = buildLoadoutsFiltersMap(destinyVersion);
  return buildSearchConfig(language, suggestionsContext, filtersMap);
}
