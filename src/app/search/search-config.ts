import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { createSelector } from 'reselect';
import { FilterDefinition, SuggestionsContext } from './filter-types';
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
import { generateSuggestionsForFilter, suggestionsContextSelector } from './suggestions-generation';

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
  suggestionsContextSelector,
  buildSearchConfig
);

//
// SearchConfig
//

export interface SearchConfig {
  allFilters: FilterDefinition[];
  filters: Record<string, FilterDefinition>;
  keywords: string[];
}

/** Builds an object that describes the available search keywords and filter definitions. */
export function buildSearchConfig(
  destinyVersion: DestinyVersion,
  suggestionsContext: SuggestionsContext = {}
): SearchConfig {
  const keywords = new Set<string>();
  const allFiltersByKeyword: Record<string, FilterDefinition> = {};
  const allApplicableFilters: FilterDefinition[] = [];
  for (const filter of allFilters) {
    if (!filter.destinyVersion || filter.destinyVersion === destinyVersion) {
      for (const keyword of generateSuggestionsForFilter(filter)) {
        keywords.add(keyword);
      }
      for (const keyword of filter.suggestionsGenerator?.(suggestionsContext) ?? []) {
        keywords.add(keyword);
      }
      allApplicableFilters.push(filter);
      const filterKeywords = Array.isArray(filter.keywords) ? filter.keywords : [filter.keywords];

      for (const keyword of filterKeywords) {
        if ($DIM_FLAVOR === 'test' && keyword in allFiltersByKeyword) {
          throw new Error(`filter clash in '${keyword}'`);
        }
        allFiltersByKeyword[keyword] = filter;
      }
    }
  }

  return {
    allFilters: allApplicableFilters,
    keywords: Array.from(keywords),
    filters: allFiltersByKeyword,
  };
}
