import { module } from 'angular';

import { PercentWidth } from './dimPercentWidth.directive';
import { tagIconFilter } from './dim-item-info';

const mod = module('inventoryModule', [])
  .directive('dimPercentWidth', PercentWidth)
  .filter('tagIcon', tagIconFilter);

export default mod.name;
