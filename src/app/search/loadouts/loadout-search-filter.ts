import { destinyVersionSelector } from 'app/accounts/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { loadoutsSelector } from 'app/loadout-drawer/loadouts-selector';
import { LoadoutsByItem, loadoutsByItemSelector } from 'app/loadout-drawer/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { buildSearchConfig } from 'app/search/search-config';
import { makeSearchFilterFactory } from 'app/search/search-filter';
import { parseAndValidateQuery } from 'app/search/search-utils';
import { createSelector } from 'reselect';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from './loadout-filter-types';
import freeformFilters from './search-filters/freeform';
import overloadedRangeFilters from './search-filters/range-overload';
import simpleFilters from './search-filters/simple';

export const allLoadoutFilters = [...simpleFilters, ...freeformFilters, ...overloadedRangeFilters];

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
  d2Definitions: D2ManifestDefinitions | undefined,
): LoadoutSuggestionsContext {
  return {
    loadouts,
    d2Definitions,
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
  loadoutsByItem: LoadoutsByItem,
  language: DimLanguage,
  d2Definitions: D2ManifestDefinitions | undefined,
): LoadoutFilterContext {
  return {
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
  loadoutsByItemSelector,
  languageSelector,
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
  (searchConfig, filterContext) => (query: string) => {
    const result = parseAndValidateQuery(query, searchConfig.filtersMap, filterContext);
    return {
      ...result,
      // For now, loadout searches are not saveable
      saveable: false,
      saveInHistory: false,
    };
  },
);
