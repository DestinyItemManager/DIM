// organize-imports-ignore
import 'cross-fetch/polyfill';
import { buildSearchConfig } from './search-config';

test('buildSearchConfig generates a reasonable filter map', () => {
  const searchConfig = buildSearchConfig(2);
  expect(Object.keys(searchConfig.filters).sort()).toMatchSnapshot();
});
