import { Search } from '@destinyitemmanager/dim-api-types';
import {
  autocompleteTermSuggestions,
  filterSortRecentSearches,
  makeFilterComplete,
} from './autocomplete';
import { buildSearchConfig } from './search-config';

describe('autocompleteTermSuggestions', () => {
  const searchConfig = buildSearchConfig(2);
  const filterComplete = makeFilterComplete(searchConfig);

  const cases: [query: string, caretIndex: number][] = [
    ['is:haspower is:b', 16],
    ['(is:blue jun)', 11],
    ['is:bow is:void', 11],
    ['season:>outl', 12],
    ['not(', 4],
  ];

  test.each(cases)(
    'autocomplete within query for |%s| with caret at position %d',
    (query: string, caretIndex: number) => {
      const candidates = autocompleteTermSuggestions(
        query,
        caretIndex,
        filterComplete,
        searchConfig
      );
      expect(candidates).toMatchSnapshot();
    }
  );

  const multiWordCases: [query: string, caretIndex: number, mockCandidate: string][] = [
    ['arctic haz', 10, 'arctic haze'],
    ['is:weapon arctic haz -is:exotic', 20, 'arctic haze'],
    ['name:"foo" arctic haz', 21, 'arctic haze'],
    ["ager's sce", 10, "ager's scepter"],
    ['the last word', 13, 'the last word'],
    ['acd/0 fee', 9, 'acd/0 feedback fence'],
    ['stat:rpm:200 first in, last', 27, 'first in, last out'],
    ['two-tail', 8, 'two-tailed fox'],
    ['arctic  haz', 11, 'arctic haze'], // this currently isn't handled due to the double space
  ];

  test.each(multiWordCases)(
    'autocomplete within multi-word query for |%s| with caret at position %d with exact match',
    (query: string, caretIndex: number, mockCandidate: string) => {
      const candidates = autocompleteTermSuggestions(
        query,
        caretIndex,
        // use mock candidates to simulate exact name-matches for multiword items
        () => [`name:"${mockCandidate}"`],
        searchConfig
      );
      expect(candidates).toMatchSnapshot();
    }
  );
});

describe('filterSortRecentSearches', () => {
  const recentSearches: Search[] = [
    { query: 'recent saved', usageCount: 1, saved: true, lastUsage: Date.now() },
    {
      query: 'yearold saved',
      usageCount: 1,
      saved: true,
      lastUsage: Date.now() - 365 * 24 * 60 * 60 * 1000,
    },
    {
      query: 'yearold unsaved',
      usageCount: 1,
      saved: false,
      lastUsage: Date.now() - 365 * 24 * 60 * 60 * 1000,
    },
    {
      query: 'yearold highuse',
      usageCount: 100,
      saved: false,
      lastUsage: Date.now() - 365 * 24 * 60 * 60 * 1000,
    },
    {
      query: 'dayold highuse',
      usageCount: 15,
      saved: false,
      lastUsage: Date.now() - 1 * 24 * 60 * 60 * 1000,
    },
    {
      query: 'dim api autosuggest',
      usageCount: 0,
      saved: false,
      lastUsage: 0,
    },
  ];

  for (let day = 0; day < 30; day++) {
    for (let usageCount = 1; usageCount < 10; usageCount++) {
      recentSearches.push({
        query: `${day} days old, ${usageCount} uses`,
        lastUsage: Date.now() - day * 24 * 60 * 60 * 1000,
        usageCount,
        saved: false,
      });
    }
  }

  const cases = [[''], ['high']];

  test.each(cases)('filter/sort recent searches for query |%s|', (query) => {
    const candidates = filterSortRecentSearches(query, recentSearches);
    expect(candidates.map((c) => c.query.fullText)).toMatchSnapshot();
  });

  const savedSearches: Search[] = [
    {
      query: 'is:patternunlocked -is:crafted',
      usageCount: 1,
      saved: true,
      lastUsage: Date.now(),
    },
    {
      query: '/* random-roll craftable guns */ is:patternunlocked -is:crafted',
      usageCount: 1,
      saved: true,
      lastUsage: Date.now() - 24 * 60 * 60 * 1000,
    },
  ];
  const highlightCases: string[] = ['', 'craft', 'craftable', 'crafted'];
  test.each(highlightCases)('check saved search highlighting for query |%s|', (query: string) => {
    const candidates = filterSortRecentSearches(query, savedSearches);
    expect(candidates).toMatchSnapshot();
  });
});

describe('filterComplete', () => {
  const searchConfig = buildSearchConfig(2);
  const filterComplete = makeFilterComplete(searchConfig);

  const terms = [['is:b'], ['jun'], ['sni'], ['stat:mob'], ['stat'], ['stat:'], ['ote']];

  test.each(terms)('autocomplete terms for |%s|', (term) => {
    const candidates = filterComplete(term);
    expect(candidates).toMatchSnapshot();
  });
});
