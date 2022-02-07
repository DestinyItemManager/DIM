import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { ItemInfos } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { createSelector } from 'reselect';
import {
  allItemsSelector,
  allNotesHashtagsSelector,
  itemInfosSelector,
} from '../inventory/selectors';
import { loadoutsSelector } from '../loadout-drawer/selectors';
import { canonicalFilterFormats, FilterDefinition, SuggestionsContext } from './filter-types';

//
// Selectors
//

/**
 * A selector for the search config for a particular destiny version. This must
 * depend on every bit of data in FilterContext so that we regenerate the filter
 * function whenever any of them changes.
 */
export const suggestionsContextSelector = createSelector(
  allItemsSelector,
  loadoutsSelector,
  d2ManifestSelector,
  itemInfosSelector,
  allNotesHashtagsSelector,
  makeSuggestionsContext
);

function makeSuggestionsContext(
  allItems: DimItem[],
  loadouts: Loadout[],
  d2Manifest: D2ManifestDefinitions,
  itemInfos: ItemInfos,
  allNotesHashtags: string[]
): SuggestionsContext {
  return {
    allItems,
    loadouts,
    d2Manifest,
    itemInfos,
    allNotesHashtags,
  };
}

const operators = ['<', '>', '<=', '>=']; // TODO: add "none"? remove >=, <=?

/**
 * Generates all the possible suggested keywords for the given filter
 *
 * Accepts partial filters with as little as just a "keywords" property,
 * if you want to generate some keywords without a full valid filter
 */
export function generateSuggestionsForFilter(
  filterDefinition: Pick<FilterDefinition, 'keywords' | 'suggestions' | 'format' | 'deprecated'>,
  forHelp?: boolean
) {
  if (filterDefinition.deprecated) {
    return [];
  }

  const { suggestions, keywords } = filterDefinition;
  const thisFilterKeywords = Array.isArray(keywords) ? keywords : [keywords];

  const filterSuggestions = suggestions === undefined ? [] : suggestions;

  const allSuggestions = [];

  for (const format of canonicalFilterFormats(filterDefinition.format)) {
    switch (format) {
      case 'simple':
        // Pass minDepth 1 to not generate "is:" and "not:" suggestions. Only generate `is:` for filters help
        allSuggestions.push(
          ...expandStringCombinations([forHelp ? ['is'] : ['is', 'not'], thisFilterKeywords], 1)
        );
        break;
      case 'query':
        // `query` is exhaustive, so only include keyword: for autocompletion, not filters help
        allSuggestions.push(
          ...expandStringCombinations([thisFilterKeywords, filterSuggestions], forHelp ? 1 : 0)
        );
        break;
      case 'freeform':
        allSuggestions.push(...expandStringCombinations([thisFilterKeywords, []]));
        break;
      case 'range':
        allSuggestions.push(...expandStringCombinations([thisFilterKeywords, operators]));
        break;
      case 'rangeoverload':
        allSuggestions.push(...expandStringCombinations([thisFilterKeywords, operators]));
        allSuggestions.push(...expandStringCombinations([thisFilterKeywords, filterSuggestions]));
        break;
      case 'stat':
        // stat lists aren't exhaustive
        allSuggestions.push(
          ...expandStringCombinations([thisFilterKeywords, filterSuggestions, operators])
        );
        break;
      case 'custom':
        break;
    }
  }

  return allSuggestions;
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
