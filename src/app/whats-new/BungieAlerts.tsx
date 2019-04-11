import { t } from 'app/i18next-t';
import React from 'react';
import { getGlobalAlerts, GlobalAlert } from '../bungie-api/bungie-core-api';
import './BungieAlerts.scss';
import { deepEqual } from 'fast-equals';
import ExternalLink from '../dim-ui/ExternalLink';
import { timer, from, empty, Subscription } from 'rxjs';
import {
  switchMap,
  startWith,
  distinctUntilChanged,
  shareReplay,
  catchError
} from 'rxjs/operators';

export const alerts$ = timer(0, 10 * 60 * 1000).pipe(
  // Fetch global alerts, but swallow errors
  switchMap(() => from(getGlobalAlerts()).pipe(catchError((_err) => empty()))),
  startWith([] as GlobalAlert[]),
  // Deep equals
  distinctUntilChanged<GlobalAlert[]>(deepEqual),
  shareReplay()
);

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
