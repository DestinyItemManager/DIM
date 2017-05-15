import angular from 'angular';

import { ItemReviewComponent } from './item-review.component';

export default angular
  .module('ReviewModule', [])
  .component('dimItemReview', ItemReviewComponent)
  .name;
