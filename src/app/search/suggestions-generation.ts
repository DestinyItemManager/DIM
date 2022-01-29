import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { ItemInfos } from 'app/inventory-stores/dim-item-info';
import { DimItem } from 'app/inventory-stores/item-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { createSelector } from 'reselect';
import {
  allItemsSelector,
  allNotesHashtagsSelector,
  itemInfosSelector,
} from '../inventory-stores/selectors';
import { loadoutsSelector } from '../loadout-drawer/selectors';
import { FilterDefinition, SuggestionsContext } from './filter-types';

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
