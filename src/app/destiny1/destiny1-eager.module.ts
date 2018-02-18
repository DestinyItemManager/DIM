import { module } from 'angular';

import { BucketService } from './d1-buckets.service';
import { Definitions } from './d1-definitions.service';

/**
 * Services we can't yet lazy-load because they're everywhere!
 */
export default module('destiny1EagerModule', [])
  .factory('dimBucketService', BucketService)
  .factory('dimDefinitions', Definitions)
  .name;
