import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { DimLanguage } from 'app/i18n';
import { FilterDefinition, canonicalFilterFormats } from './filter-types';
import { generateSuggestionsForFilter } from './suggestions-generation';
import { plainString } from './text-utils';

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
}

export function buildFiltersMap<I, FilterCtx, SuggestionsCtx>(
  destinyVersion: DestinyVersion,
  allFilters: FilterDefinition<I, FilterCtx, SuggestionsCtx>[],
): FiltersMap<I, FilterCtx, SuggestionsCtx> {
  const isFilters: Record<string, FilterDefinition<I, FilterCtx, SuggestionsCtx>> = {};
  const kvFilters: Record<string, FilterDefinition<I, FilterCtx, SuggestionsCtx>> = {};
  const allApplicableFilters: FilterDefinition<I, FilterCtx, SuggestionsCtx>[] = [];
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
              `Conflicting is:${keyword} filter -- only the last inserted filter will work.`,
            );
          }
          isFilters[keyword] = filter;
        }
        if (hasKv) {
          if ($DIM_FLAVOR === 'test' && kvFilters[keyword]) {
            throw new Error(
              `Conflicting ${keyword}:value filter -- only the last inserted filter will work.`,
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

/** Builds an object that describes the available search keywords and filter definitions. */
export function buildSearchConfig<I, FilterCtx, SuggestionsCtx>(
  language: DimLanguage,
  suggestionsContext: SuggestionsCtx,
  filtersMap: FiltersMap<I, FilterCtx, SuggestionsCtx>,
): SearchConfig<I, FilterCtx, SuggestionsCtx> {
  const suggestions = new Set<string>();
  for (const filter of filtersMap.allFilters) {
    for (const suggestion of generateSuggestionsForFilter(filter, suggestionsContext)) {
      suggestions.add(suggestion);
    }
  }

  return {
    filtersMap,
    suggestions: Array.from(suggestions, (rawText) => ({
      rawText,
      plainText: plainString(rawText, language),
    })),
    language,
  };
}
