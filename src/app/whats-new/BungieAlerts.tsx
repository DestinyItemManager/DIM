import * as React from 'react';
import { alerts$ } from '../shell/bungie-alerts.component';
import { GlobalAlert } from '../bungie-api/bungie-core-api';
import { Subscription } from 'rxjs/Subscription';
import { t } from 'i18next';
import './BungieAlerts.scss';

interface State {
  alerts: GlobalAlert[];
}

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
