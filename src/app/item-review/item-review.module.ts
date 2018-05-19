import { module } from 'angular';

import { ItemReviewComponent } from './item-review.component';
import { DestinyTrackerService } from './destiny-tracker.service';

export default module('ReviewModule', [])
  .factory('dimDestinyTrackerService', DestinyTrackerService)
  .component('dimItemReview', ItemReviewComponent)
  .name;
