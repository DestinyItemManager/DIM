import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { createSelector } from 'reselect';
import { FilterDefinition } from './filter-types';
import advancedFilters from './search-filters/advanced';
import d1Filters from './search-filters/d1-filters';
import dupeFilters from './search-filters/dupes';
import freeformFilters from './search-filters/freeform';
import itemInfosFilters from './search-filters/item-infos';
import knownValuesFilters from './search-filters/known-values';
import loadoutFilters from './search-filters/loadouts';
import simpleRangeFilters from './search-filters/range-numeric';
import overloadedRangeFilters from './search-filters/range-overload';
import ratingsFilters from './search-filters/ratings';
import simpleFilters from './search-filters/simple';
import socketFilters from './search-filters/sockets';
import statFilters from './search-filters/stats';
import locationFilters from './search-filters/stores';
import wishlistFilters from './search-filters/wishlist';

const allFilters = [
  ...advancedFilters,
  ...d1Filters,
  ...dupeFilters,
  ...freeformFilters,
  ...itemInfosFilters,
  ...knownValuesFilters,
  ...loadoutFilters,
  ...simpleRangeFilters,
  ...overloadedRangeFilters,
  ...($featureFlags.reviewsEnabled ? ratingsFilters : []),
  ...simpleFilters,
  ...socketFilters,
  ...statFilters,
  ...locationFilters,
  ...($featureFlags.wishLists ? wishlistFilters : []),
];

export const searchConfigSelector = createSelector(destinyVersionSelector, buildSearchConfig);

//
// SearchConfig
//

export interface SearchConfig {
  filters: Record<string, FilterDefinition>;
  keywords: string[];
}

/** Builds an object that describes the available search keywords and filter definitions. */
export function buildSearchConfig(destinyVersion: DestinyVersion): SearchConfig {
  let keywords: string[] = [];
  const allFiltersByKeyword: Record<string, FilterDefinition> = {};
  for (const filter of allFilters) {
    if (!filter.destinyVersion || filter.destinyVersion === destinyVersion) {
      keywords.push(...generateSuggestionsForFilter(filter));
      for (const keyword of filter.keywords) {
        allFiltersByKeyword[keyword] = filter;
      }
    }
  }
  keywords = Array.from(new Set(keywords));

  return {
    keywords,
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
function expandStringCombinations(stringGroups: string[][]) {
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
  return results.flat();
}

const operators = ['<', '>', '<=', '>=', '=']; // TODO: add "none"? remove >=, <=?

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
      return expandStringCombinations([
        thisFilterKeywords,
        [...nestedSuggestions[0], ...operators],
      ]);
    default:
      return expandStringCombinations([['is', 'not'], thisFilterKeywords]);
  }
}
