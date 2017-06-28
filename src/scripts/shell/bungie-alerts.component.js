import _ from 'underscore';

export const BungieAlertsComponent = {
  controller: BungieAlertsCtrl
};

/**
 * A component that will check for Bungie alerts every 5 minutes and publish them as toasts.
 * Each alert will only be shown once per session.
 */
function BungieAlertsCtrl(BungieCoreApi, $interval, toaster, $translate) {
  'ngInject';

  this.$onInit = function() {
    // Poll every 5 minutes for new alerts
    this.interval = $interval(pollBungieAlerts, 5 * 1000);
    pollBungieAlerts();
  };

  this.$onDestroy = function() {
    $interval.cancel(this.interval);
  };

  // Memoize so we only show each alert once per session
  const showAlertToaster = _.memoize((alert) => {
    toaster.pop({
      type: alert.type,
      title: $translate.instant('BungieAlert.Title'),
      body: alert.body
    });
  }, (alert) => `${alert.key}-${alert.timestamp}`);

  function pollBungieAlerts() {
    BungieCoreApi.getGlobalAlerts()
      .then((alerts) => {
        alerts.forEach(showAlertToaster);
      })
      .catch((e) => { });
  }
}