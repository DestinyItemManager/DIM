import { buildSearchConfig } from './search-filter';
import { makeFilterComplete } from './autocomplete';

describe('autocompleteTermSuggestions', () => {});

describe('filterSortRecentSearches', () => {});

describe('filterComplete', () => {
  const searchConfig = buildSearchConfig(2);
  const filterComplete = makeFilterComplete(searchConfig);

  const terms = [['is:b']];

  test.each(terms)('autocomplete terms for |%s|', (term) => {
    const candidates = filterComplete(term);
    expect(candidates).toMatchSnapshot();
  });
});
