import _ from 'underscore';

export function ActivityTrackerDirective($document, $interval, dimActivityTrackerService, dimStoreService, loadingTracker) {
  'ngInject';

  return {
    restrict: 'A',
    link: function ActivityTrackerLink(scope) {
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

      const ONE_MINUTE = 60 * 1000;
      const FIVE_MINUTES = 5 * 60 * 1000;
      const ONE_HOUR = 60 * 60 * 1000;

      const refresh = _.throttle(() => {
        loadingTracker.addPromise(dimStoreService.reloadStores());
      }, ONE_MINUTE);

      const activeWithinLastHour = dimActivityTrackerService.activeWithinTimespan
        .bind(dimActivityTrackerService, ONE_HOUR);

      function refreshAccountData() {
        const dimHasNoActivePromises = !loadingTracker.active();
        const userWasActiveInTheLastHour = activeWithinLastHour();
        const isDimVisible = !$document.hidden;

        if (dimHasNoActivePromises && userWasActiveInTheLastHour && isDimVisible) {
          refresh();
        }
      }

      const refreshAccountDataInterval = $interval(refreshAccountData, FIVE_MINUTES);

      scope.$on('$destroy', () => {
        $document.off('click', clickHandler);
        $document.off('visibilitychange', visibilityHandler);
        $interval.cancel(refreshAccountDataInterval);
      });
    }
  };
}