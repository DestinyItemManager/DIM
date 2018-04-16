import * as _ from 'underscore';
import { equals } from 'angular';
import { getGlobalAlerts, GlobalAlert } from '../bungie-api/bungie-core-api';
import { Observable } from 'rxjs/Observable';
import '../rx-operators';
import { subscribeOnScope } from '../rx-utils';

export const alerts$ = Observable.timer(0, 10 * 60 * 1000)
  // Fetch global alerts, but swallow errors
  .switchMap(() => Observable.fromPromise(getGlobalAlerts()).catch(() => Observable.empty<GlobalAlert[]>()))
  .startWith([] as GlobalAlert[])
  // Deep equals
  .distinctUntilChanged<GlobalAlert[]>(equals);
  // TODO: Publish? this is the part I never get
  // TODO: redux?

export const BungieAlertsComponent = {
  controller: BungieAlertsCtrl
};

/**
 * A component that will check for Bungie alerts every 5 minutes and publish them as toasts.
 * Each alert will only be shown once per session.
 */
function BungieAlertsCtrl($scope, toaster, $i18next) {
  'ngInject';

  this.$onInit = () => {
    subscribeOnScope($scope, alerts$, (alerts) => {
      alerts.forEach(showAlertToaster);
    });
  };

  // Memoize so we only show each alert once per session
  const showAlertToaster = _.memoize((alert) => {
    const bungieTwitterLink = '<a target="_blank" rel="noopener noreferrer" href="http://twitter.com/BungieHelp">@BungieHelp Twitter</a>';
    const dimTwitterLink = '<a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM">@ThisIsDIM Twitter</a>';
    const twitter = `<div>${$i18next.t('BungieService.Twitter')} ${bungieTwitterLink} | ${dimTwitterLink}</div>`;

    toaster.pop({
      type: alert.type,
      title: $i18next.t('BungieAlert.Title'),
      bodyOutputType: 'trustedHtml',
      showCloseButton: true,
      body: `<p>${alert.body}</p>${twitter}`
    });
  }, (alert) => `${alert.key}-${alert.timestamp}`) as (alert: GlobalAlert) => void;
}
