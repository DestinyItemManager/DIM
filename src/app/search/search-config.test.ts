import { buildSearchConfig } from './search-config';

test('buildSearchConfig generates a reasonable filter map', () => {
  const searchConfig = buildSearchConfig(2);
  expect(Object.keys(searchConfig.filters)).toMatchSnapshot();
});
