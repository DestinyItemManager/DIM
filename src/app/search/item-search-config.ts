import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import memoizeOne from 'memoize-one';
import { createSelector } from 'reselect';
import { SuggestionsContext } from './filter-types';
import { buildFiltersMap, buildSearchConfig } from './search-config';
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
import { suggestionsContextSelector } from './suggestions-generation';

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

export const searchConfigSelector = createSelector(
  destinyVersionSelector,
  languageSelector,
  suggestionsContextSelector,
  buildItemSearchConfig,
);

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
