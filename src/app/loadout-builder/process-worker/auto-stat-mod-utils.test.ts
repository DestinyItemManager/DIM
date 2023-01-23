import { StatHashes } from 'app/../data/d2/generated-enums';
import { buildCacheV2 } from './auto-stat-mod-utils';

describe('test artifice', () => {
  test('the cache works', () => {
    const cache = buildCacheV2(5);
    console.log(JSON.stringify(cache.statCaches[StatHashes.Mobility]));
  });
});
