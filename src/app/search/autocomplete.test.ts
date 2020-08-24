import { buildSearchConfig } from './search-config';
import {
  makeFilterComplete,
  autocompleteTermSuggestions,
  filterSortRecentSearches,
} from './autocomplete';
import { Search } from '@destinyitemmanager/dim-api-types';

describe('autocompleteTermSuggestions', () => {
  const searchConfig = buildSearchConfig(2);
  const filterComplete = makeFilterComplete(searchConfig);

  const cases = [
    ['is:haspower is:b', 16],
    ['(is:blue jun)', 11],
    ['is:bow is:void', 11],
  ];

  test.each(cases)(
    'autocomplete within query for |%s| with caret at position %d',
    (query: string, caretIndex: number) => {
      const candidates = autocompleteTermSuggestions(query, caretIndex, filterComplete);
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
    expect(candidates.map((c) => c.query)).toMatchSnapshot();
  });
});

describe('filterComplete', () => {
  const searchConfig = buildSearchConfig(2);
  const filterComplete = makeFilterComplete(searchConfig);

  const terms = [['is:b'], ['jun'], ['sni'], ['stat:mob'], ['stat'], ['stat:']];

  test.each(terms)('autocomplete terms for |%s|', (term) => {
    const candidates = filterComplete(term);
    expect(candidates).toMatchSnapshot();
  });
});
