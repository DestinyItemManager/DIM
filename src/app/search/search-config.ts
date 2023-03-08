import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { createSelector } from 'reselect';
import { ArmoryEntry, buildArmoryIndex } from './armory-search';
import { canonicalFilterFormats, FilterDefinition, SuggestionsContext } from './filter-types';
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
  /* `is:keyword` filters */
  isFilters: Record<string, FilterDefinition>;
  /* `keyword:value` filters */
  kvFilters: Record<string, FilterDefinition>;
  suggestions: string[];
  armorySuggestions?: ArmoryEntry[];
}

/** Builds an object that describes the available search keywords and filter definitions. */
export function buildSearchConfig(
  destinyVersion: DestinyVersion,
  suggestionsContext: SuggestionsContext = {}
): SearchConfig {
  const suggestions = new Set<string>();
  const isFilters: Record<string, FilterDefinition> = {};
  const kvFilters: Record<string, FilterDefinition> = {};
  const allApplicableFilters: FilterDefinition[] = [];
  for (const filter of allFilters) {
    if (!filter.destinyVersion || filter.destinyVersion === destinyVersion) {
      // augment filter's suggestionKeywords with dynamic additions
      if (filter.suggestionKeywordGenerator) {
        const suggestionKeywords = new Set(filter.suggestionKeywords ?? []);
        for (const keyword of filter.suggestionKeywordGenerator(suggestionsContext) ?? []) {
          suggestionKeywords.add(keyword);
        }
        if (suggestionKeywords.size) {
          filter.suggestionKeywords = Array.from(suggestionKeywords);
        }
      }
      for (const suggestion of generateSuggestionsForFilter(filter)) {
        suggestions.add(suggestion);
      }
      for (const suggestion of filter.suggestionsGenerator?.(suggestionsContext) ?? []) {
        suggestions.add(suggestion);
      }
      allApplicableFilters.push(filter);
      const filterKeywords = Array.isArray(filter.keywords) ? filter.keywords : [filter.keywords];
      const filterFormats = canonicalFilterFormats(filter.format);
      const hasSimple = filterFormats.some((f) => f === 'simple');
      const hasKv = filterFormats.some((f) => f !== 'simple');

      for (const keyword of filterKeywords) {
        if (hasSimple) {
          if ($DIM_FLAVOR === 'test' && isFilters[keyword]) {
            throw new Error(
              `Conflicting is:${keyword} filter -- only the last inserted filter will work.`
            );
          }
          isFilters[keyword] = filter;
        }
        if (hasKv) {
          if ($DIM_FLAVOR === 'test' && kvFilters[keyword]) {
            throw new Error(
              `Conflicting ${keyword}:value filter -- only the last inserted filter will work.`
            );
          }
          kvFilters[keyword] = filter;
        }
      }
    }
  }

  const armorySuggestions =
    suggestionsContext.d2Manifest && buildArmoryIndex(suggestionsContext.d2Manifest);

  return {
    allFilters: allApplicableFilters,
    suggestions: Array.from(suggestions),
    isFilters,
    kvFilters,
    armorySuggestions,
  };
}
