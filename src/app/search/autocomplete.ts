import { Search } from '@destinyitemmanager/dim-api-types';
import { t } from 'app/i18next-t';
import { compact, uniqBy } from 'app/utils/collections';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { ArmoryEntry, getArmorySuggestions } from './armory-search';
import { canonicalFilterFormats } from './filter-types';
import { lexer, makeCommentString, parseQuery, QueryLexerError } from './query-parser';
import { FiltersMap, SearchConfig, Suggestion } from './search-config';
import { plainString } from './text-utils';

/** The autocompleter/dropdown will suggest different types of searches */
export const enum SearchItemType {
  /** Searches from your history */
  Recent,
  /** Explicitly saved searches */
  Saved,
  /** Searches suggested by DIM Sync but not part of your history */
  Suggested,
  /** Generated autocomplete searches */
  Autocomplete,
  /** Open help */
  Help,
  /** Open the armory view for a page */
  ArmoryEntry,
}

export interface SearchQuery {
  /** The full text of the query */
  fullText: string;
  /** The query's top-level comment */
  header?: string;
  /** The query text excluding the top-level comment */
  body: string;
  /** Help text */
  helpText?: string;
}

interface BaseSearchItem {
  type: SearchItemType;
  /** The suggested query */
  query: SearchQuery;
  /** An optional part of the query that will be highlighted */
  highlightRange?: {
    section: 'header' | 'body';
    /** The indices of the first and last character that should be highlighted */
    range: [number, number];
  };
}

export interface ArmorySearchItem extends BaseSearchItem {
  type: SearchItemType.ArmoryEntry;
  armoryItem: ArmoryEntry;
}

/** An item in the search autocompleter */
export type SearchItem =
  | ArmorySearchItem
  | (BaseSearchItem & {
      type: Exclude<SearchItemType, SearchItemType.ArmoryEntry>;
    });

/** matches a keyword that's probably a math comparison, but not with a value on the RHS */
const mathCheck = /[\d<>=]$/;

/** if one of these has been typed, stop guessing which filter and just offer this filter's values */
// TODO: Generate this from the search config
const filterNames = [
  'is',
  'not',
  'tag',
  'notes',
  'stat',
  'stack',
  'count',
  'source',
  'perk',
  'perkname',
  'mod',
  'modname',
  'name',
  'description',
];

/**
 * Produce a memoized autocompleter function that takes search text plus a list of recent/saved searches
 * and produces the contents of the autocomplete list.
 */
export default function createAutocompleter<I, FilterCtx, SuggestionsCtx>(
  searchConfig: SearchConfig<I, FilterCtx, SuggestionsCtx>,
  armoryEntries: ArmoryEntry[] | undefined,
) {
  const filterComplete = makeFilterComplete(searchConfig);

  return (
    query: string,
    caretIndex: number,
    recentSearches: Search[],
    includeArmory?: boolean,
    maxResults = 7,
  ): SearchItem[] => {
    // If there's a query, it's always the first entry
    const queryItem: SearchItem | undefined = query
      ? {
          type: SearchItemType.Autocomplete,
          query: {
            fullText: query,
            body: query,
          },
        }
      : undefined;
    // Generate completions of the current search
    const filterSuggestions = autocompleteTermSuggestions(
      query,
      caretIndex,
      filterComplete,
      searchConfig,
    );

    // Recent/saved searches
    const recentSearchItems = filterSortRecentSearches(query, recentSearches);

    // Help is always last...
    // Add an item for opening the filter help
    const helpItem: SearchItem = {
      type: SearchItemType.Help,
      query: {
        // use query as the text so we don't change text when selecting it
        fullText: query || '',
        body: query || '',
      },
    };

    const armorySuggestions = includeArmory
      ? getArmorySuggestions(armoryEntries, query, searchConfig.language)
      : [];

    // mix them together
    return [
      ...uniqBy(
        compact([queryItem, ...filterSuggestions, ...recentSearchItems]),
        (i) => i.query.fullText,
      ).slice(0, maxResults),
      ...armorySuggestions,
      helpItem,
    ];
  };
}

// TODO: this should probably be different when there's a query vs not. With a query
// it should sort on how closely you match, while without a query it's just offering
// you your "favorite" searches.
export const recentSearchComparator = reverseComparator(
  chainComparator<Search>(
    // Saved searches before recents
    compareBy((s) => s.saved),
    compareBy((s) => frecency(s.usageCount, s.lastUsage)),
  ),
);

/**
 * "Frecency" combines frequency and recency to form a ranking score from [0,1].
 * Note that our usages aren't individually tracked, so they never expire.
 */
function frecency(usageCount: number, lastUsedTimestampMillis: number) {
  // We just multiply them together with equal weight, but we may want to weight them differently in the future.
  return normalizeUsage(usageCount) * normalizeRecency(lastUsedTimestampMillis);
}

/**
 * A sigmoid normalization function that normalizes usages to [0,1]. After 10 uses it's all the same.
 * https://www.desmos.com/calculator/fxi9thkuft
 */
//
function normalizeUsage(val: number) {
  const z = 0.4;
  const k = 0.5;
  const t = 0.9;
  return (1 + t) / (1 + Math.exp(-k * (val - z))) - t;
}

/**
 * An exponential decay score based on the age of the last usage.
 * https://www.desmos.com/calculator/3jfqccibdn
 */
//
function normalizeRecency(timestamp: number) {
  const days = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  const halfLife = 14; // two weeks
  return Math.pow(2, -days / halfLife);
}

export function filterSortRecentSearches(query: string, recentSearches: Search[]): SearchItem[] {
  // Recent/saved searches
  const recentSearchesForQuery = query
    ? recentSearches.filter((s) => s.query !== query && s.query.includes(query))
    : Array.from(recentSearches);
  return recentSearchesForQuery.sort(recentSearchComparator).map((s) => {
    const ast = parseQuery(s.query);
    const topLevelComment = ast.comment && makeCommentString(ast.comment);
    const result: SearchItem = {
      type: s.saved
        ? SearchItemType.Saved
        : s.usageCount > 0
          ? SearchItemType.Recent
          : SearchItemType.Suggested,
      query: {
        fullText: s.query,
        header: ast.comment,
        body: topLevelComment ? s.query.substring(topLevelComment.length).trim() : s.query,
      },
    };

    // highlight the matched range of the query
    if (query) {
      if (result.query.header) {
        const index = result.query.header.indexOf(query);
        if (index !== -1) {
          result.highlightRange = {
            section: 'header',
            range: [index, index + query.length],
          };
        }
      }
      if (!result.highlightRange) {
        const index = result.query.body.indexOf(query);
        if (index !== -1) {
          result.highlightRange = {
            section: 'body',
            range: [index, index + query.length],
          };
        }
      }
    }

    return result;
  });
}

const caretEndRegex = /[\s)]|$/;

/**
 * Find the position of the last "incomplete" filter segment of the query before the caretIndex.
 *
 * For example, given the query (with the caret at |):
 * name:foo bar| baz
 * This should return { term: "bar", index: 9 }
 *
 * @returns the start indexes of various points that could be incomplete filters
 */
function findLastFilter(queryUpToCaret: string): number[] | null {
  // Find the indexes where any incomplete filter starts. For example if the query is:
  // name:"foo" bar baz
  // then the open keywords are "bar baz" and "baz"
  let incompleteFilterIndices: number[] = [];
  try {
    // We can use the query lexer for this to scan through tokens in the query without parsing the whole AST.
    for (const token of lexer(queryUpToCaret)) {
      switch (token.type) {
        // We're trying to complete any filter. Maybe it's actually complete, which is OK because we just won't return a suggestion
        case 'filter': {
          if (
            // Ignore complete quoted tokens, they're definitively finished.
            !token.quoted
          ) {
            incompleteFilterIndices.push(token.startIndex);
          } else {
            incompleteFilterIndices = [];
          }
          break;
        }
        case 'and':
        case 'or':
        case 'implicit_and':
          // ignore these - they neither start an incomplete filter section, nor end it
          break;
        default:
          // reset, we saw something that's definitely not part of a filter
          incompleteFilterIndices = [];
          break;
      }
    }
  } catch (e) {
    // If the lexer failed because of unmatched quotes, that's *definitely* something to autocomplete!
    if (e instanceof QueryLexerError) {
      incompleteFilterIndices = [e.startIndex];
    }
  }

  return incompleteFilterIndices;
}

/**
 * Given a query and a cursor position, isolate the term that's being typed and offer reformulated queries
 * that replace that term with one from our filterComplete function.
 */
export function autocompleteTermSuggestions<I, FilterCtx, SuggestionsCtx>(
  query: string,
  caretIndex: number,
  filterComplete: (term: string) => string[],
  searchConfig: SearchConfig<I, FilterCtx, SuggestionsCtx>,
): SearchItem[] {
  if (!query) {
    return [];
  }

  // Seek to the end of the current part
  caretIndex = (caretEndRegex.exec(query.slice(caretIndex))?.index || 0) + caretIndex;

  const queryUpToCaret = query.slice(0, caretIndex);
  const lastFilters = findLastFilter(queryUpToCaret);
  if (!lastFilters) {
    return [];
  }

  // Find the first index that gives us suggestions and return those suggestions
  for (const index of lastFilters) {
    const base = query.slice(0, index);
    const term = queryUpToCaret.substring(index);
    const candidates = filterComplete(term);

    // new query is existing query minus match plus suggestion
    const result = candidates.map((word): SearchItem => {
      const filterDef = findFilter(word, searchConfig.filtersMap);
      const newQuery = base + word + query.slice(caretIndex);
      const helpText: string | undefined = filterDef
        ? Array.isArray(filterDef.description)
          ? t(...filterDef.description)
          : t(filterDef.description)
        : undefined;
      return {
        query: {
          fullText: newQuery,
          body: newQuery,
          helpText: helpText?.replace(/\.$/, ''),
        },
        type: SearchItemType.Autocomplete,
        highlightRange: {
          section: 'body',
          range: [index, index + word.length],
        },
      };
    });
    if (result.length) {
      return result;
    }
  }
  return [];
}

function findFilter<I, FilterCtx, SuggestionsCtx>(
  term: string,
  filtersMap: FiltersMap<I, FilterCtx, SuggestionsCtx>,
) {
  const parts = term.split(':');
  const filterName = parts[0];
  const filterValue = parts[1];
  // "is:" filters are slightly special cased
  return filterName === 'is' ? filtersMap.isFilters[filterValue] : filtersMap.kvFilters[filterName];
}

/**
 * This builds a filter-complete function that uses the given search config's keywords to
 * offer autocomplete suggestions for a partially typed term.
 */
export function makeFilterComplete<I, FilterCtx, SuggestionsCtx>(
  searchConfig: SearchConfig<I, FilterCtx, SuggestionsCtx>,
) {
  // these filters might include quotes, so we search for two text segments to ignore quotes & colon
  // i.e. `name:test` can find `name:"test item"`
  const freeformTerms = Object.values(searchConfig.filtersMap.kvFilters)
    .filter((f) => canonicalFilterFormats(f.format).includes('freeform'))
    .flatMap((f) => f.keywords)
    .map((s) => `${s}:`);

  // TODO: also search filter descriptions
  return (typed: string): string[] => {
    if (!typed) {
      return [];
    }

    const typedToLower = typed.toLowerCase();
    let typedPlain = plainString(typedToLower, searchConfig.language);

    // because we are fighting against other elements for space in the suggestion dropdown,
    // we will entirely skip "not" and "<" and ">" and "<=" and ">=" suggestions,
    // unless the user seems to explicity be working toward them
    const hasNotModifier = typedPlain.startsWith('not');
    const includesAdvancedMath =
      typedPlain.endsWith(':') || typedPlain.endsWith('<') || typedPlain.endsWith('<');
    const filterLowPrioritySuggestions = (s: Suggestion) =>
      (hasNotModifier || !s.plainText.startsWith('not:')) &&
      (includesAdvancedMath || !/[<>]=?$/.test(s.plainText));

    let mustStartWith = '';
    if (freeformTerms.some((t) => typedPlain.startsWith(t))) {
      const typedSegments = typedPlain.split(':');
      mustStartWith = typedSegments.shift()!;
      typedPlain = typedSegments.join(':');
    }

    // for most searches (non-string-based), if there's already a colon typed,
    // we are on a path through known terms, not wildly guessing, so we only match
    // from beginning of the typed string, instead of middle snippets from suggestions.

    // this way, "stat:" matches "stat:" but not "basestat:"
    // and "stat" matches "stat:" and "basestat:"
    const matchType = !mustStartWith && typedPlain.includes(':') ? 'startsWith' : 'includes';

    let suggestions = searchConfig.suggestions
      .filter(
        (word) => word.plainText.startsWith(mustStartWith) && word.plainText[matchType](typedPlain),
      )
      .filter(filterLowPrioritySuggestions);

    // TODO: sort this first?? it depends on term in one place

    suggestions = suggestions.sort(
      chainComparator(
        // ---------------
        // assumptions based on user behavior. beyond the "contains" filter above, considerations like
        // "the user is probably typing the begining of the filter name, not the middle"
        // ---------------

        // prioritize terms where we are typing the beginning of, ignoring the stem:
        // 'stat' -> 'stat:' before 'basestat:'
        // 'arm' -> 'is:armor' before 'is:sidearm'
        // but only for top level stuff (we want examples like 'basestat:' before 'stat:rpm:')
        compareBy(
          (word) =>
            colonCount(word.plainText) > 1
              ? 1 // last if it's a big one like 'stat:rpm:'
              : word.plainText.startsWith(typedPlain) ||
                  word.plainText.indexOf(typedPlain) === word.plainText.indexOf(':') + 1
                ? -1 // first if it's a term start or segment start
                : 0, // mid otherwise
        ),

        // for is/not, prioritize words with less left to type,
        // so "is:armor" comes before "is:armormod".
        // but only is/not, not other list-based suggestions,
        // otherwise it prioritizes "dawn" over "redwar" after you type "season:"
        // which i am not into.
        compareBy((word) => {
          if (word.plainText.startsWith('not:') || word.plainText.startsWith('is:')) {
            return word.plainText.length - (typedPlain.length + word.plainText.indexOf(typedPlain));
          } else {
            return 0;
          }
        }),

        // ---------------
        // once we have accounted for high level assumptions about user input,
        // make some opinionated choices about which filters are a priority
        // ---------------

        // tags are UGC and therefore important
        compareBy((word) => !word.plainText.startsWith('tag:')),

        // sort incomplete terms (ending with ':') to the front
        compareBy((word) => !word.plainText.endsWith(':')),

        // push "not" and "<=" and ">=" to the bottom if they are present
        // we discourage "not", and "<=" and ">=" are highly discoverable from "<" and ">"
        compareBy(
          (word) =>
            word.plainText.startsWith('not:') ||
            word.plainText.includes(':<=') ||
            word.plainText.includes(':>='),
        ),

        // sort more-basic incomplete terms (fewer colons) to the front
        // i.e. suggest "stat:" before "stat:magazine:"
        compareBy((word) => (word.plainText.startsWith('is:') ? 0 : colonCount(word.plainText))),

        // (within the math operators that weren't shoved to the far bottom,)
        // push math operators to the front for things like "masterwork:"
        compareBy((word) => !mathCheck.test(word.plainText)),
      ),
    );
    if (filterNames.includes(typedPlain.split(':')[0])) {
      return suggestions.map((suggestion) => suggestion.rawText);
    } else if (suggestions.length) {
      // we will always add in (later) a suggestion of "what you've already typed so far"
      // so prevent "what's been typed" from appearing in the returned suggestions from this function
      const deDuped = new Set(suggestions.map((suggestion) => suggestion.rawText));
      deDuped.delete(typed);
      deDuped.delete(typedToLower);
      deDuped.delete(typedPlain);
      return [...deDuped];
    }
    return [];
  };
}

function colonCount(s: string) {
  let count = 0;
  for (const c of s) {
    if (c === ':') {
      count++;
    }
  }
  return count;
}
