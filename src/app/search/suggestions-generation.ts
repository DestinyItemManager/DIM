import { FilterDefinition, canonicalFilterFormats } from './filter-types';

const operators = ['<', '>', '<=', '>=']; // TODO: add "none"? remove >=, <=?

/**
 * Generates all the possible suggested keywords for the given filter
 *
 * Accepts partial filters with as little as just a "keywords" property,
 * if you want to generate some keywords without a full valid filter
 */
export function generateSuggestionsForFilter<I, FilterCtx, SuggestionsCtx>(
  filterDefinition: Pick<
    FilterDefinition<I, FilterCtx, SuggestionsCtx>,
    'keywords' | 'suggestions' | 'format' | 'overload' | 'deprecated' | 'suggestionsGenerator'
  >,
  suggestionsContext: SuggestionsCtx,
) {
  return generateGroupedSuggestionsForFilter(filterDefinition, suggestionsContext, false).flatMap(
    ({ keyword, ops }) => {
      if (ops) {
        return [keyword].concat(ops.map((op) => `${keyword}${op}`));
      } else {
        return [keyword];
      }
    },
  );
}

export function generateGroupedSuggestionsForFilter<I, FilterCtx, SuggestionsCtx>(
  filterDefinition: Pick<
    FilterDefinition<I, FilterCtx, SuggestionsCtx>,
    'keywords' | 'suggestions' | 'format' | 'overload' | 'deprecated' | 'suggestionsGenerator'
  >,
  suggestionsContext: SuggestionsCtx,
  forHelp?: boolean,
): { keyword: string; ops?: string[] }[] {
  if (filterDefinition.deprecated) {
    return [];
  }

  const { suggestions, keywords } = filterDefinition;
  const thisFilterKeywords = Array.isArray(keywords) ? keywords : [keywords];

  const filterSuggestions = suggestions === undefined ? [] : suggestions;

  const allSuggestions = [];

  const expandFlat = (stringGroups: string[][], minDepth = 0) =>
    expandStringCombinations(stringGroups)
      .slice(minDepth)
      .flat()
      .map((s) => ({ keyword: s }));

  // We delay expanding ops because ops on their own expand the filters list significantly.
  // For autocompletion `generateSuggestionsForFilter` above expands the ops, but the filters
  // help has some special display to group the operator variants.
  const expandOps = (stringGroups: string[][], ops: string[]) => {
    const combinations = expandStringCombinations([...stringGroups, []]);
    const partialSuggestions = combinations
      .slice(0, stringGroups.length - 1)
      .flat()
      .map((s) => ({ keyword: s }));
    const opSuggestions = combinations[stringGroups.length - 1].map((s) => ({ keyword: s, ops }));
    return partialSuggestions.concat(opSuggestions);
  };

  for (const format of canonicalFilterFormats(filterDefinition.format)) {
    switch (format) {
      case 'simple':
        // Pass minDepth 1 to not generate "is:" and "not:" suggestions. Only generate `is:` for filters help
        allSuggestions.push(
          ...expandFlat([forHelp ? ['is'] : ['is', 'not'], thisFilterKeywords], 1),
        );
        break;
      case 'query':
        // `query` is exhaustive, so only include keyword: for autocompletion, not filters help
        allSuggestions.push(
          ...expandFlat([thisFilterKeywords, filterSuggestions], forHelp ? 1 : 0),
        );
        break;
      case 'freeform':
        allSuggestions.push(...expandFlat([thisFilterKeywords, []]));
        break;
      case 'range':
        allSuggestions.push(...expandOps([thisFilterKeywords], operators));
        if (filterDefinition.overload) {
          const overloadNames = Object.keys(filterDefinition.overload);
          allSuggestions.push(...expandFlat([thisFilterKeywords, overloadNames], 1));

          // Outside of filter help (i.e. only for autocompletion), also expand overloaded ranges like season:<current
          if (!forHelp) {
            allSuggestions.push(
              ...expandFlat(
                [
                  thisFilterKeywords,
                  operators.flatMap((op) =>
                    overloadNames.map((overloadName) => `${op}${overloadName}`),
                  ),
                ],
                1,
              ),
            );
          }
        }
        break;
      case 'stat':
        // stat lists aren't exhaustive
        allSuggestions.push(...expandOps([thisFilterKeywords, filterSuggestions], operators));
        break;
      case 'custom':
        break;
    }
  }

  for (const suggestion of filterDefinition.suggestionsGenerator?.(suggestionsContext) ?? []) {
    if (typeof suggestion === 'string') {
      allSuggestions.push({ keyword: suggestion });
    } else {
      allSuggestions.push(suggestion);
    }
  }

  return allSuggestions;
}

/**
 * loops through collections of strings (filter segments),
 * generating combinations grouped by number of segments
 *
 * for example, with
 * `[ [a], [b,c], [d,e] ]`
 * as an input, this generates
 *
 * `[ [a:], [a:b:, a:c:], [a:b:d, a:b:e, a:c:d, a:c:e] ]`
 */
function expandStringCombinations(stringGroups: string[][]) {
  const results: string[][] = [];
  for (let i = 0; i < stringGroups.length; i++) {
    const stringGroup = stringGroups[i];
    const stems = results.length ? results.at(-1)! : undefined;
    const newResults = stringGroup.flatMap((suffix) =>
      stems
        ? stems.map(
            (stem) =>
              (stem ? `${stem}${suffix}` : suffix) + (i === stringGroups.length - 1 ? '' : ':'),
          )
        : [`${suffix}:`],
    );
    results.push(newResults);
  }
  return results;
}
