import { module } from 'angular';

import { ItemReviewComponent } from './item-review.component';
import { DestinyTrackerService } from './destiny-tracker.service';

export default module('ReviewModule', [])
  .factory('dimDestinyTrackerService', DestinyTrackerService)
  .component('dimItemReview', ItemReviewComponent)
  // http://jasonwatmore.com/post/2016/03/31/angularjs-utc-to-local-date-time-filter
  .filter('utcToLocal', ($filter) => {
    return (utcDateString, format) => {
      // return if input date is null or undefined
      if (!utcDateString) {
        return null;
      }

      // append 'Z' to the date string to indicate UTC time if the timezone isn't already specified
      if (utcDateString.indexOf('Z') === -1 && utcDateString.indexOf('+') === -1) {
        utcDateString += 'Z';
      }

      // convert and format date using the built in angularjs date filter
      return $filter('date')(utcDateString, format);
    };
  })
  .name;
