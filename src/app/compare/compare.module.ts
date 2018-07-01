import { module } from 'angular';

import { CompareComponent, StatRangeFilter } from './compare.component';

export default module('compareModule', [])
  .component('dimCompare', CompareComponent)
  .filter('statRange', StatRangeFilter)
  .name;
