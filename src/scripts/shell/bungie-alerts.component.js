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
    const bungieTwitterLink = '<a target="_blank" rel="noopener noreferrer" href="http://twitter.com/BungieHelp">@BungieHelp Twitter</a> <a target="_blank" rel="noopener noreferrer" href="http://twitter.com/BungieHelp"></a>';
    const dimTwitterLink = '<a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM">@ThisIsDIM Twitter</a> <a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM"></a>';
    const twitter = `<div>${$translate.instant('BungieService.Twitter')} ${bungieTwitterLink} | ${dimTwitterLink}</div>`;

    toaster.pop({
      type: alert.type,
      title: $translate.instant('BungieAlert.Title'),
      bodyOutputType: 'trustedHtml',
      body: `<p>${alert.body}</p>${twitter}`
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