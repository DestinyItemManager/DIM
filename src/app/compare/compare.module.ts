import { module } from 'angular';

import { CompareComponent, StatRangeFilter } from './compare.component';
import { CompareService } from './compare.service';

export default module('compareModule', [])
  .component('dimCompare', CompareComponent)
  .filter('statRange', StatRangeFilter)
  .factory('dimCompareService', CompareService)
  .name;
