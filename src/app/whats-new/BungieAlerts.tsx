import { t } from 'i18next';
import * as React from 'react';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { getGlobalAlerts, GlobalAlert } from '../bungie-api/bungie-core-api';
import '../rx-operators';
import './BungieAlerts.scss';
import { deepEqual } from 'fast-equals';
import ExternalLink from '../dim-ui/ExternalLink';

export const alerts$ = Observable.timer(0, 10 * 60 * 1000)
  // Fetch global alerts, but swallow errors
  .switchMap(() =>
    Observable.fromPromise(getGlobalAlerts()).catch(() => Observable.empty<GlobalAlert[]>())
  )
  .startWith([] as GlobalAlert[])
  // Deep equals
  .distinctUntilChanged<GlobalAlert[]>(deepEqual)
  .shareReplay();

interface State {
  alerts: GlobalAlert[];
}

/**
 * Displays maintenance alerts from Bungie.net.
 */
// TODO: How to mark that they've been "seen"?
export default class BungieAlerts extends React.Component<{}, State> {
  private subscription: Subscription;

  constructor(props) {
    super(props);
    this.state = { alerts: [] };
  }

  componentDidMount() {
    this.subscription = alerts$.subscribe((alerts) => this.setState({ alerts }));
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    const { alerts } = this.state;

    return (
      <div className="bungie-alerts">
        {alerts.map((alert) => (
          <div key={alert.key} className={`bungie-alert bungie-alert-${alert.type}`}>
            <b>{t('BungieAlert.Title')}</b>
            <p dangerouslySetInnerHTML={{ __html: alert.body }} />
            <div>
              {t('BungieService.Twitter')}{' '}
              <ExternalLink href="http://twitter.com/BungieHelp">@BungieHelp Twitter</ExternalLink>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
