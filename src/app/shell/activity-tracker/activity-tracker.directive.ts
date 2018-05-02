import * as _ from 'underscore';
import { IRootScopeService, ITimeoutService, IDirective } from 'angular';
import { ActivityTrackerService } from './activity-tracker.service';

const dimActivityTrackerService = new ActivityTrackerService();

export function ActivityTrackerDirective(
  $document,
  $timeout: ITimeoutService,
  loadingTracker,
  $rootScope: IRootScopeService
): IDirective {
  'ngInject';

  return {
    restrict: 'A',
    link: function link(scope) {
      function clickHandler() {
        dimActivityTrackerService.track();
      }

      function visibilityHandler() {
        if ($document[0].hidden === false) {
          dimActivityTrackerService.track();
          refreshAccountData();
        }
      }

      $document.on('click', clickHandler);
      $document.on('visibilitychange', visibilityHandler);
      $document.on('online', refreshAccountData);

      const ONE_MINUTE = 60 * 1000;
      const FIVE_MINUTES = 5 * 60 * 1000;
      const ONE_HOUR = 60 * 60 * 1000;

      const refresh = _.throttle(() => {
        // Individual pages should listen to this event and decide what to refresh,
        // and their services should decide how to cache/dedup refreshes.
        // This event should *NOT* be listened to by services!
        // TODO: replace this with an observable?
        $rootScope.$broadcast('dim-refresh');
      }, ONE_MINUTE, { trailing: false });

      const activeWithinLastHour = dimActivityTrackerService.activeWithinTimespan
        .bind(dimActivityTrackerService, ONE_HOUR);

      function refreshAccountData() {
        const dimHasNoActivePromises = !loadingTracker.active();
        const userWasActiveInTheLastHour = activeWithinLastHour();
        const isDimVisible = !$document.hidden;
        const isOnline = navigator.onLine;

        if (dimHasNoActivePromises && userWasActiveInTheLastHour && isDimVisible && isOnline) {
          refresh();
        }
      }

      let refreshAccountDataInterval = $timeout(refreshAccountData, FIVE_MINUTES);

      scope.$on('$destroy', () => {
        $document.off('click', clickHandler);
        $document.off('visibilitychange', visibilityHandler);
        $document.off('online', refreshAccountData);
        $timeout.cancel(refreshAccountDataInterval);
      });

      // Every time we refresh for any reason, reset the timer
      scope.$on('dim-refresh', () => {
        $timeout.cancel(refreshAccountDataInterval);
        refreshAccountDataInterval = $timeout(refreshAccountData, FIVE_MINUTES);
      });
    }
  };
}
