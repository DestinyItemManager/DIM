import { module } from 'angular';

import { SimpleItemComponent } from './dimSimpleItem.directive';
import { PercentWidth } from './dimPercentWidth.directive';
import { tagIconFilter } from './dim-item-info';

const mod = module('inventoryModule', [])
  .component('dimSimpleItem', SimpleItemComponent)
  .directive('dimPercentWidth', PercentWidth)
  .filter('tagIcon', tagIconFilter);

export default mod.name;
