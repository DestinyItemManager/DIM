import { hasKeys } from 'app/utils/util';
import { getTestDefinitions } from 'testing/test-utils';
import { D2ManifestDefinitions } from './d2-definitions';

let defs: D2ManifestDefinitions;

beforeAll(async () => {
  defs = await getTestDefinitions();
});

test('something', () => {
  expect(hasKeys(defs.InventoryItem)).toBe(true);
});
