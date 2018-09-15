import { module } from 'angular';

import { tagIconFilter, StoreItemComponent } from './dimStoreItem.directive';
import { SimpleItemComponent } from './dimSimpleItem.directive';
import { PercentWidth, percent } from './dimPercentWidth.directive';

const mod = module('inventoryModule', [])
  .component('dimSimpleItem', SimpleItemComponent)
  .component('dimStoreItem', StoreItemComponent)
  .directive('dimPercentWidth', PercentWidth)
  .filter('tagIcon', tagIconFilter)
  .filter('percent', () => percent);

export default mod.name;
