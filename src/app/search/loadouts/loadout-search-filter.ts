import { destinyVersionSelector } from 'app/accounts/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { loadoutsSelector } from 'app/loadout-drawer/loadouts-selector';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';
import { currentStoreSelector } from '../../inventory/selectors';
import { DimStore } from '../../inventory/store-types';
import { LoadoutsByItem, loadoutsByItemSelector } from '../../loadout-drawer/selectors';
import { querySelector } from '../../shell/selectors';
import { FilterDefinition } from '../filter-types';
import { buildSearchConfig } from '../search-config';
import { makeSearchFilterFactory } from '../search-filter';
import { parseAndValidateQuery } from '../search-utils';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from './loadout-filter-types';
import freeformFilters from './search-filters/freeform';
import overloadedRangeFilters from './search-filters/range-overload';

const allLoadoutFilters = [...freeformFilters, ...overloadedRangeFilters];

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
  d2ManifestSelector,
  makeLoadoutSuggestionsContext,
);

function makeLoadoutSuggestionsContext(
  loadouts: Loadout[],
  d2Manifest: D2ManifestDefinitions | undefined,
): LoadoutSuggestionsContext {
  return {
    loadouts,
    d2Manifest,
  };
}

export const loadoutSearchConfigSelector = createSelector(
  destinyVersionSelector,
  languageSelector,
  loadoutSuggestionsContextSelector,
  () => allLoadoutFilters,
  buildSearchConfig,
);

function makeLoadoutFilterContext(
  currentStore: DimStore | undefined,
  loadoutsByItem: LoadoutsByItem,
  language: DimLanguage,
  d2Definitions: D2ManifestDefinitions | undefined,
): LoadoutFilterContext {
  return {
    currentStore: currentStore!,
    loadoutsByItem,
    language,
    d2Definitions,
  };
}

/**
 * A selector for the filterContext for a particular destiny version. This must
 * depend on every bit of data a filter might need to run, so that we regenerate the filter
 * functions whenever any of them changes.
 */
const loadoutFilterContextSelector = createSelector(
  currentStoreSelector,
  loadoutsByItemSelector,
  languageSelector,
  d2ManifestSelector,
  makeLoadoutFilterContext,
);

// TODO: a filter selector generator

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

/** A selector for a function for searching loadouts, given the current search query. */
export const loadoutSearchFilterSelector = createSelector(
  querySelector,
  loadoutFilterFactorySelector,
  (query, filterFactory) => filterFactory(query),
);

/** A selector for all loadouts filtered by whatever's currently in the search box. */
export const filteredLoadoutsSelector = createSelector(
  loadoutsSelector,
  loadoutSearchFilterSelector,
  (loadouts, searchFilter) => loadouts.filter(searchFilter),
);

/** A selector for a function for validating a query. */
export const validateLoadoutQuerySelector = createSelector(
  loadoutSearchConfigSelector,
  loadoutFilterContextSelector,
  (searchConfig, filterContext) => (query: string) =>
    parseAndValidateQuery(query, searchConfig.filtersMap, filterContext),
);

/** Whether the current search query is valid. */
export const queryValidLoadoutSelector = createSelector(
  querySelector,
  validateLoadoutQuerySelector,
  (query, validateQuery) => validateQuery(query).valid,
);

export function makeSearchSelectors<I, FilterCtx, SuggestionsCtx>(
  filters: FilterDefinition<I, FilterCtx, SuggestionsCtx>[],
  filterCtxSelector: (state: RootState) => FilterCtx,
  suggestionsCtxSelector: (state: RootState) => SuggestionsCtx,
) {
  const searchConfigSelector = createSelector(
    destinyVersionSelector,
    languageSelector,
    suggestionsCtxSelector,
    () => filters,
    buildSearchConfig,
  );

  /**
   * A selector for the search config for a particular destiny version.
   * Combines the searchConfig (list of filters),
   * and the filterContext (list of other stat information filters can use)
   * into a filter factory (for converting parsed strings into filter functions)
   */
  const filterFactorySelector = createSelector(
    searchConfigSelector,
    filterCtxSelector,
    makeSearchFilterFactory,
  );

  /** A selector for a function for validating a query. */
  const validateQuerySelector = createSelector(
    searchConfigSelector,
    filterCtxSelector,
    (searchConfig, filterContext) => (query: string) =>
      parseAndValidateQuery(query, searchConfig.filtersMap, filterContext),
  );

  return {
    searchConfigSelector,
    filterFactorySelector,
    validateQuerySelector,
  };
}
