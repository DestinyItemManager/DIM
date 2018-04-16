import { equals } from 'angular';
import { t } from 'i18next';
import * as React from 'react';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { getGlobalAlerts, GlobalAlert } from '../bungie-api/bungie-core-api';
import '../rx-operators';
import './BungieAlerts.scss';

// TODO: Move this back to a shared file so we can observe it from the header?
export const alerts$ = Observable.timer(0, 10 * 60 * 1000)
  // Fetch global alerts, but swallow errors
  .switchMap(() => Observable.fromPromise(getGlobalAlerts()).catch(() => Observable.empty<GlobalAlert[]>()))
  // .switchMap(() => [[{
  //   body: 'foo',
  //   type: 'info',
  //   timestamp: 'foo',
  //   key: 'foo'
  // }] as GlobalAlert[]])
  .startWith([] as GlobalAlert[])
  // Deep equals
  .distinctUntilChanged<GlobalAlert[]>(equals);
  // TODO: Publish? this is the part I never get
  // TODO: redux?

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
        {alerts.map((alert) =>
          <div
            key={alert.key}
            className={`bungie-alert bungie-alert-${alert.type}`}
          >
            <b>{t('BungieAlert.Title')}</b>
            <p dangerouslySetInnerHTML={{ __html: alert.body }} />
            <div>
              {t('BungieService.Twitter')}{' '}
              <a target="_blank" rel="noopener noreferrer" href="http://twitter.com/BungieHelp">@BungieHelp Twitter</a>
            </div>
          </div>
        )}
      </div>
    );
  }
}
