import { module } from 'angular';

import { ItemReviewComponent } from './item-review.component';
import { PercentWidth } from '../inventory/dimPercentWidth.directive';

export default module('ReviewModule', [])
  .component('dimItemReview', ItemReviewComponent)
  .directive('dimPercentWidth', PercentWidth).name;
