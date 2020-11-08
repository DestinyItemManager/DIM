import { FilterDefinition } from './filter-types';
import type { QueryAST } from './query-parser';
import { SearchConfig } from './search-config';

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
 *
 * Accepts partial filters with as little as just a "keywords" property,
 * if you want to generate some keywords without a full valid filter
 */
export function generateSuggestionsForFilter(
  filterDefinition: Pick<FilterDefinition, 'keywords' | 'suggestions' | 'format' | 'deprecated'>
) {
  if (filterDefinition.deprecated) {
    return [];
  }

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
    case 'custom':
      return [];
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
      if (filterName === 'is') {
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
