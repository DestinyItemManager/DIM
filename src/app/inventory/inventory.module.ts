import { module } from 'angular';

import { tagIconFilter, StoreItemComponent } from './dimStoreItem.directive';
import { StoreBucketComponent } from './dimStoreBucket.directive';
import { StatsComponent } from './dimStats.directive';
import { SimpleItemComponent } from './dimSimpleItem.directive';
import { PercentWidth, percent } from './dimPercentWidth.directive';
import { react2angular } from 'react2angular';
import ClearNewItems from './ClearNewItems';

export default module('inventoryModule', [])
  .component('dimStoreBucket', StoreBucketComponent)
  .component('dimStats', StatsComponent)
  .component('dimSimpleItem', SimpleItemComponent)
  .component('dimClearNewItems', react2angular(ClearNewItems, ['account']))
  .component('dimStoreItem', StoreItemComponent)
  .directive('dimPercentWidth', PercentWidth)
  .filter('tagIcon', tagIconFilter)
  .filter('percent', () => percent)
  .name;
