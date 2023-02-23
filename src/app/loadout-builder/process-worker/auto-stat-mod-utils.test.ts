import { StatHashes } from 'app/../data/d2/generated-enums';
import { buildAutoModsMap } from './auto-stat-mod-utils';

describe('test artifice', () => {
  test('the cache works', () => {
    const cache = buildAutoModsMap(5);
    console.log(JSON.stringify(cache.statCaches[StatHashes.Mobility]));
  });
});
