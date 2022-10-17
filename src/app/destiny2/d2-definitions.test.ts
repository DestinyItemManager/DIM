import { getTestDefinitions } from 'testing/test-utils';
import { D2ManifestDefinitions } from './d2-definitions';

let defs: D2ManifestDefinitions;

beforeAll(async () => {
  defs = await getTestDefinitions();
});

test('something', () => {
  expect(Object.keys(defs.InventoryItem).length).toBeGreaterThan(0);
});
