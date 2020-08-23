import { SearchConfig } from './search-config';
import _ from 'lodash';
import { Search } from '@destinyitemmanager/dim-api-types';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import memoizeOne from 'memoize-one';

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
export default function createAutocompleter(searchConfig: SearchConfig) {
  const filterComplete = makeFilterComplete(searchConfig);

  return memoizeOne((query: string, caretIndex: number, recentSearches: Search[]): SearchItem[] => {
    // If there's a query, it's always the first entry
    const queryItem = query
      ? {
          type: SearchItemType.Autocomplete,
          query: query,
        }
      : undefined;
    // Generate completions of the current search
    const filterSuggestions = autocompleteTermSuggestions(query, caretIndex, filterComplete);

    // Recent/saved searches
    const recentSearchItems = filterSortRecentSearches(query, recentSearches);

    // Help is always last...
    // Add an item for opening the filter help
    const helpItem = {
      type: SearchItemType.Help,
      query: query || '', // use query as the text so we don't change text when selecting it
    };

    // mix them together
    return [
      ..._.take(
        _.uniqBy(
          _.compact([queryItem, ...filterSuggestions, ...recentSearchItems]),
          (i) => i.query
        ),
        7
      ),
      helpItem,
    ];
  });
}

// TODO: this should probably be different when there's a query vs not. With a query
// it should sort on how closely you match, while without a query it's just offering
// you your "favorite" searches.
const recentSearchComparator = reverseComparator(
  chainComparator<Search>(
    // Saved searches before recents
    compareBy((s) => s.saved),
    compareBy((s) => frecency(s.usageCount, s.lastUsage))
  )
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

export function filterSortRecentSearches(query: string, recentSearches: Search[]) {
  // Recent/saved searches
  // TODO: Filter recent searches by query
  // TODO: Sort recent searches by relevance (time+usage+saved)
  // TODO: don't show results that exactly match the input
  // TODO: need a better way to search recent queries
  // TODO: if there are a ton of recent/saved searches, this sorting might get expensive. Maybe sort them in the Redux store if
  //       we aren't going to do different sorts for query vs. non-query
  const recentSearchesForQuery = query
    ? recentSearches.filter((s) => s.query.includes(query))
    : Array.from(recentSearches);
  return recentSearchesForQuery.sort(recentSearchComparator).map((s) => ({
    type: s.saved
      ? SearchItemType.Saved
      : s.usageCount > 0
      ? SearchItemType.Recent
      : SearchItemType.Suggested,
    query: s.query,
  }));
}

const caretEndRegex = /([\s)]|$)/;

/**
 * Given a query and a cursor position, isolate the term that's being typed and offer reformulated queries
 * that replace that term with one from our filterComplete function.
 */
export function autocompleteTermSuggestions(
  query: string,
  caretIndex: number,
  filterComplete: (term: string) => string[]
) {
  if (!query) {
    return [];
  }

  // Seek to the end of the current part
  caretIndex = (caretEndRegex.exec(query.slice(caretIndex))?.index || 0) + caretIndex;

  // Find the last word that looks like a search
  const match = /\b([\w:"']{3,})$/i.exec(query.slice(0, caretIndex));
  if (match) {
    const term = match[1];
    const candidates = filterComplete(term);
    const base = query.slice(0, match.index);

    // new query is existing query minus match plus suggestion
    return candidates.map((word) => {
      const newQuery = base + word + query.slice(caretIndex);
      return {
        query: newQuery,
        type: SearchItemType.Autocomplete,
        highlightRange: [match.index, match.index + word.length],
        // TODO: help from the matched query
      };
    });
  }

  return [];
}

/**
 * This builds a filter-complete function that uses the given search config's keywords to
 * offer autocomplete suggestions for a partially typed term.
 */
export function makeFilterComplete(searchConfig: SearchConfig) {
  // TODO: also search filter descriptions
  // TODO: also search individual items from the manifest???
  return (term: string): string[] => {
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
}
