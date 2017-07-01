import angular from 'angular';

import { CompareComponent, StatRangeFilter } from './compare.component';
import { CompareService } from './compare.service';

export default angular
  .module('compareModule', [])
  .component('dimCompare', CompareComponent)
  .filter('statRange', StatRangeFilter)
  .factory('dimCompareService', CompareService)
  .name;
