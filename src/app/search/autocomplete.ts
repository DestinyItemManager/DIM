import { SearchConfig } from './search-filter';
import _ from 'lodash';
import { Search } from '@destinyitemmanager/dim-api-types';
import { chainComparator, compareBy } from 'app/utils/comparators';

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
  // TODO: add types for exact-match item or perk that adds them to the query?
}

/** An item in the search autocompleter */
export interface SearchItem {
  type: SearchItemType;
  /** The suggested query */
  query: string;
  /** An optional part of the query that will be highlighted */
  highlightRange?: [number, number];
  /** Help text */
  helpText?: React.ReactNode;
}

/** matches a keyword that's probably a math comparison */
const mathCheck = /[\d<>=]/;

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
  'name',
  'description',
];

/**
 * Produce a memoized autocompleter function that takes search text plus a list of recent/saved searches
 * and produces the contents of the autocomplete list.
 */
// TODO: break up into independent, testable functions!
export default function createAutocompleter(searchConfig: SearchConfig) {
  // TODO: build some memoized functions here

  /** Autocomplete filters. Given a partial term, suggests valid filters. */
  // TODO: move to its own factory fn
  const filterComplete = (term: string): string[] => {
    if (!term) {
      return [];
    }

    const lowerTerm = term.toLowerCase();

    let words = term.includes(':') // with a colon, only match from beginning
      ? // ("stat:" matches "stat:" but not "basestat:")
        searchConfig.keywords.filter((word) => word.startsWith(lowerTerm))
      : // ("stat" matches "stat:" and "basestat:")
        searchConfig.keywords.filter((word) => word.includes(lowerTerm));

    // TODO: sort this first?? it depends on term in one place
    words = words.sort(
      chainComparator(
        // tags are UGC and therefore important
        compareBy((word) => !word.startsWith('tag:')),
        // prioritize is: & not: because a pair takes up only 2 slots at the top,
        // vs filters that end in like 8 statnames
        compareBy((word) => !(word.startsWith('is:') || word.startsWith('not:'))),
        // sort incomplete terms (ending with ':') to the front
        compareBy((word) => !word.endsWith(':')),
        // sort more-basic incomplete terms (fewer colons) to the front
        compareBy((word) => word.split(':').length),
        // prioritize strings we are typing the beginning of
        compareBy((word) => word.indexOf(term.toLowerCase()) !== 0),
        // prioritize words with less left to type
        compareBy((word) => word.length - (term.length + word.indexOf(lowerTerm))),
        // push math operators to the front for things like "masterwork:"
        compareBy((word) => !mathCheck.test(word))
      )
    );
    if (filterNames.includes(term.split(':')[0])) {
      return words;
    } else if (words.length) {
      const deDuped = new Set([term, ...words]);
      deDuped.delete(term);
      return [...deDuped];
    }
    return [];
  };

  return (query: string, caretIndex: number, recentSearches: Search[]): SearchItem[] => {
    // If there's a query, it's always the first entry
    const queryItem = query && {
      type: SearchItemType.Autocomplete,
      query: query,
    };

    // Fixed space for suggestions (7-10)

    // Generate completions of the current search
    // TODO: also search descriptions
    // TODO: also search individual items from the manifest???
    let filterSuggestions: SearchItem[] = [];
    if (query) {
      const match = /\b([\w:"']{3,})$/i.exec(query.slice(0, caretIndex));
      if (match) {
        const term = match[1];
        console.log('query match', match);
        const candidates = filterComplete(term);
        // TODO: text ranges!

        const replace = (word: string) => {
          word = word.toLowerCase();
          return word.startsWith('is:') && word.startsWith('not:') ? `${word} ` : word;
        };

        const base = query.slice(0, match.index);

        console.log('candidates', candidates);

        // new query is existing query minus match plus suggestion
        filterSuggestions = candidates.map((word) => {
          const replacement = replace(word);
          const newQuery = base + replacement + query.slice(caretIndex);
          return {
            query: newQuery,
            type: SearchItemType.Autocomplete,
            highlightRange: [match.index, match.index + replacement.length],
            // TODO: help from the matched query
          };
        });
      }
    }

    // Recent/saved searches
    // TODO: Filter recent searches by query
    // TODO: Sort recent searches by relevance (time+usage+saved)
    // TODO: don't show results that exactly match the input
    const recentSearchItems = recentSearches.map((s) => ({
      type: s.saved
        ? SearchItemType.Saved
        : s.usageCount > 0
        ? SearchItemType.Recent
        : SearchItemType.Suggested,
      query: s.query,
    }));

    // Help is always last...
    // Add an item for opening the filter help
    const helpItem = {
      type: SearchItemType.Help,
      query: query || '', // use query as the text so we don't change text when selecting it
    };

    console.log('autocomplete', {
      queryItem,
      filterSuggestions,
      recentSearchItems,
      items: [
        ..._.take(
          _.uniqBy(
            _.compact([queryItem, ...filterSuggestions, ...recentSearchItems]),
            (i) => i.query
          ),
          6
        ),
        helpItem,
      ],
    });

    // mix them together
    // TODO: mixer/ranker function
    return [
      ..._.take(
        _.uniqBy(
          _.compact([queryItem, ...filterSuggestions, ...recentSearchItems]),
          (i) => i.query
        ),
        6
      ),
      helpItem,
    ];
  };
}
