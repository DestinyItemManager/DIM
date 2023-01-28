import { Search } from '@destinyitemmanager/dim-api-types';
import {
  autocompleteTermSuggestions,
  filterSortRecentSearches,
  makeFilterComplete,
} from './autocomplete';
import { buildSearchConfig } from './search-config';

/**
 * Given a string like "foo ba|r", find where the "|" is and remove it,
 * returning its index. This allows for readable test cases that depend on
 * cursor position. If the cursor should be at the end of the string, it can be
 * omitted entirely.
 */
function extractCaret(stringWithCaretPlaceholder: string): [caretIndex: number, query: string] {
  const caretIndex = stringWithCaretPlaceholder.indexOf('|');
  if (caretIndex == -1) {
    return [stringWithCaretPlaceholder.length, stringWithCaretPlaceholder];
  }
  return [caretIndex, stringWithCaretPlaceholder.replace('|', '')];
}

describe('autocompleteTermSuggestions', () => {
  const searchConfig = buildSearchConfig(2);
  const filterComplete = makeFilterComplete(searchConfig);

  const cases: string[] = [
    'is:haspower is:b',
    '(is:blue ju|n)',
    'is:bow is:v|oid',
    'season:>outl',
    'not(',
  ];

  test.each(cases)('autocomplete within query for {%s}', (queryWithCaret) => {
    const [caretIndex, query] = extractCaret(queryWithCaret);
    const candidates = autocompleteTermSuggestions(query, caretIndex, filterComplete, searchConfig);
    expect(candidates).toMatchSnapshot();
  });

  const multiWordCases: [query: string, mockCandidate: string][] = [
    ['arctic haz', 'arctic haze'],
    ['is:weapon arctic haz| -is:exotic', 'arctic haze'],
    ['name:"foo" arctic haz', 'arctic haze'],
    ["ager's sce", "ager's scepter"],
    ['the last word', 'the last word'],
    ['acd/0 fee', 'acd/0 feedback fence'],
    ['stat:rpm:200 first in, last', 'first in, last out'],
    ['two-tail', 'two-tailed fox'],
    ['(is:a or is:b) and (is:c or multi w|)', 'multi word'],
    ['arctic  haz', 'arctic haze'], // two spaces inbetween words
    ['"rare curio" arctic haz', 'arctic haze'],
    ['"rare curio" or arctic haz', 'arctic haze'],
    ['toil and trou', 'toil and trouble'], // todo: not handled due to the `and`
    ['rare curio or arctic haz', 'arctic haze'], // todo: parser result is unexpected here
  ];

  test.each(multiWordCases)(
    'autocomplete within multi-word query for {%s} with exact match',
    (queryWithCaret: string, mockCandidate: string) => {
      const [caretIndex, query] = extractCaret(queryWithCaret);
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
