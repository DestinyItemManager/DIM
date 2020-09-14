import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { createSelector } from 'reselect';
import { FilterDefinition } from './filter-types';
import type { QueryAST } from './query-parser';
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

export const searchConfigSelector = createSelector(destinyVersionSelector, buildSearchConfig);

//
// SearchConfig
//

export interface SearchConfig {
  allFilters: FilterDefinition[];
  filters: Record<string, FilterDefinition>;
  keywords: string[];
}

/** Builds an object that describes the available search keywords and filter definitions. */
export function buildSearchConfig(destinyVersion: DestinyVersion): SearchConfig {
  const keywords = new Set<string>();
  const allFiltersByKeyword: Record<string, FilterDefinition> = {};
  const allApplicableFilters: FilterDefinition[] = [];
  for (const filter of allFilters) {
    if (!filter.destinyVersion || filter.destinyVersion === destinyVersion) {
      for (const keyword of generateSuggestionsForFilter(filter)) {
        keywords.add(keyword);
      }
      allApplicableFilters.push(filter);
      const filterKeywords = Array.isArray(filter.keywords) ? filter.keywords : [filter.keywords];
      for (const keyword of filterKeywords) {
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

/**
 * loops through collections of strings (filter segments), generating combinations
 *
 * for example, with
 * `[ [a], [b,c], [d,e] ]`
 * as an input, this generates
 *
 * `[ a:, a:b:, a:c:, a:b:d, a:b:e, a:c:d, a:c:e ]`
 */
function expandStringCombinations(stringGroups: string[][], minDepth = 0) {
  const results: string[][] = [];
  for (let i = 0; i < stringGroups.length; i++) {
    const stringGroup = stringGroups[i];
    const stems = results.length ? results[results.length - 1] : undefined;
    const newResults = stringGroup.flatMap((suffix) =>
      stems
        ? stems.map(
            (stem) =>
              (stem ? `${stem}${suffix}` : suffix) + (i === stringGroups.length - 1 ? '' : ':')
          )
        : [`${suffix}:`]
    );
    results.push(newResults);
  }
  return results.slice(minDepth).flat();
}

const operators = ['<', '>', '<=', '>=']; // TODO: add "none"? remove >=, <=?

/**
 * Generates all the possible suggested keywords for the given filter
 */
export function generateSuggestionsForFilter(filterDefinition: FilterDefinition) {
  const { suggestions, keywords } = filterDefinition;
  const thisFilterKeywords = Array.isArray(keywords) ? keywords : [keywords];

  const nestedSuggestions = suggestions === undefined ? [] : [suggestions];

  switch (filterDefinition.format) {
    case 'query':
      return expandStringCombinations([thisFilterKeywords, ...nestedSuggestions]);
    case 'freeform':
      return expandStringCombinations([thisFilterKeywords, []]);
    case 'range':
      return expandStringCombinations([thisFilterKeywords, ...nestedSuggestions, operators]);
    case 'rangeoverload':
      return [
        ...expandStringCombinations([thisFilterKeywords, operators]),
        ...expandStringCombinations([thisFilterKeywords, ...nestedSuggestions]),
      ];
    default:
      // Pass minDepth 1 to not generate "is:" and "not:" suggestions
      return expandStringCombinations([['is', 'not'], thisFilterKeywords], 1);
  }
}

/**
 * Return whether the query is completely valid - syntactically, and where every term matches a known filter.
 */
export function validateQuery(query: QueryAST, searchConfig: SearchConfig) {
  if (query.error) {
    return false;
  }
  switch (query.op) {
    case 'filter': {
      let filterName = query.type;
      const filterValue = query.args;

      // "is:" filters are slightly special cased
      if (filterName == 'is') {
        filterName = filterValue;
      }

      const filterDef = searchConfig.filters[filterName];
      if (filterDef) {
        // TODO: validate that filterValue is correct
        return true;
      } else {
        return false;
      }
    }
    case 'not':
      return validateQuery(query.operand, searchConfig);
    case 'and':
    case 'or': {
      return query.operands.every((q) => validateQuery(q, searchConfig));
    }
    case 'noop':
      return true;
  }
}
