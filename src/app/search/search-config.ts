import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { DimItem } from 'app/inventory/item-types';
import memoizeOne from 'memoize-one';
import { createSelector } from 'reselect';
import { ArmoryEntry, buildArmoryIndex } from './armory-search';
import {
  FilterContext,
  FilterDefinition,
  SuggestionsContext,
  canonicalFilterFormats,
} from './filter-types';
import advancedFilters from './search-filters/advanced';
import d1Filters from './search-filters/d1-filters';
import dupeFilters from './search-filters/dupes';
import freeformFilters, { plainString } from './search-filters/freeform';
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
  languageSelector,
  suggestionsContextSelector,
  buildSearchConfig
);

//
// SearchConfig
//

export interface FiltersMap<I, FilterCtx, SuggestionsCtx> {
  allFilters: FilterDefinition<I, FilterCtx, SuggestionsCtx>[];
  /* `is:keyword` filters */
  isFilters: Record<string, FilterDefinition<I, FilterCtx, SuggestionsCtx>>;
  /* `keyword:value` filters */
  kvFilters: Record<string, FilterDefinition<I, FilterCtx, SuggestionsCtx>>;
}

export interface Suggestion {
  /** The original suggestion text. */
  rawText: string;
  /** The plainString'd version (with diacritics removed, if applicable). */
  plainText: string;
}

export interface SearchConfig<I, FilterCtx, SuggestionsCtx> {
  filtersMap: FiltersMap<I, FilterCtx, SuggestionsCtx>;
  language: DimLanguage;
  suggestions: Suggestion[];
  armorySuggestions?: ArmoryEntry[];
}

export const buildFiltersMap = memoizeOne(
  (destinyVersion: DestinyVersion): FiltersMap<DimItem, FilterContext, SuggestionsContext> => {
    const isFilters: Record<string, FilterDefinition> = {};
    const kvFilters: Record<string, FilterDefinition> = {};
    const allApplicableFilters: FilterDefinition[] = [];
    for (const filter of allFilters) {
      if (!filter.destinyVersion || filter.destinyVersion === destinyVersion) {
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

    return {
      isFilters,
      kvFilters,
      allFilters: allApplicableFilters,
    };
  }
);

/** Builds an object that describes the available search keywords and filter definitions. */
export function buildSearchConfig(
  destinyVersion: DestinyVersion,
  language: DimLanguage,
  suggestionsContext: SuggestionsContext = {}
): SearchConfig<DimItem, FilterContext, SuggestionsContext> {
  const suggestions = new Set<string>();
  const filtersMap = buildFiltersMap(destinyVersion);
  for (const filter of filtersMap.allFilters) {
    for (const suggestion of generateSuggestionsForFilter(filter)) {
      suggestions.add(suggestion);
    }
    for (const suggestion of filter.suggestionsGenerator?.(suggestionsContext) ?? []) {
      suggestions.add(suggestion);
    }
  }

  const armorySuggestions =
    suggestionsContext.d2Manifest && buildArmoryIndex(suggestionsContext.d2Manifest, language);

  return {
    filtersMap,
    suggestions: [...suggestions].map((rawText) => ({
      rawText,
      plainText: plainString(rawText, language),
    })),
    language,
    armorySuggestions,
  };
}
