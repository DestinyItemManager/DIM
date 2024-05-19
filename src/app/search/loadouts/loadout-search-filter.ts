import { destinyVersionSelector } from 'app/accounts/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { loadoutsSelector } from 'app/loadout-drawer/loadouts-selector';
import { Loadout } from 'app/loadout/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { createSelector } from 'reselect';
import { currentStoreSelector } from '../../inventory/selectors';
import { DimStore } from '../../inventory/store-types';
import { LoadoutsByItem, loadoutsByItemSelector } from '../../loadout/selectors';
import { buildSearchConfig } from '../search-config';
import { makeSearchFilterFactory } from '../search-filter';
import { parseAndValidateQuery } from '../search-utils';
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
