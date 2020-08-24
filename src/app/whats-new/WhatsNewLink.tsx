import React from 'react';
import { DimVersions } from './versions';
import { alerts$ } from './BungieAlerts';
import { GlobalAlert } from '../bungie-api/bungie-core-api';
import './WhatsNewLink.scss';
import { t } from 'app/i18next-t';
import { dimNeedsUpdate$, reloadDIM } from '../register-service-worker';
import { AppIcon, updateIcon } from '../shell/icons';
import { Subscriptions } from '../utils/rx-utils';
import { NavLink } from 'react-router-dom';

interface State {
  dimNeedsUpdate: boolean;
  alerts: GlobalAlert[];
  showChangelog: boolean;
}

/**
 * A link/button to the "What's New" page that highlights the most important action.
 */
export default class WhatsNewLink extends React.Component<{}, State> {
  private subscriptions = new Subscriptions();

  constructor(props) {
    super(props);
    this.state = {
      dimNeedsUpdate: false,
      alerts: [],
      showChangelog: false,
    };
  }

  componentDidMount() {
    this.subscriptions.add(
      DimVersions.showChangelog$.subscribe((showChangelog) => this.setState({ showChangelog })),
      alerts$.subscribe((alerts) => this.setState({ alerts })),
      dimNeedsUpdate$.subscribe((dimNeedsUpdate) => this.setState({ dimNeedsUpdate }))
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render(): JSX.Element | null {
    const { dimNeedsUpdate, alerts, showChangelog } = this.state;

    // TODO: use presstip/tooltip to help?
    // TODO: try dots and bottom-borders

    if (dimNeedsUpdate) {
      return (
        <a className="link menuItem" onClick={reloadDIM}>
          <AppIcon className="upgrade" icon={updateIcon} />
          {t('Header.UpgradeDIM')}
        </a>
      );
    }

    if (alerts.length) {
      return (
        <NavLink to="/whats-new" className="link menuItem">
          <span className={`badge-new bungie-alert-${alerts[0].type}`} />{' '}
          {t('Header.BungieNetAlert')}
        </NavLink>
      );
    }

    if (showChangelog) {
      return (
        <NavLink to="/whats-new" className="link menuItem">
          <span className="badge-new" /> {t('Header.WhatsNew')}
        </NavLink>
      );
    }

    return (
      <NavLink to="/whats-new" className="link menuItem">
        {t('Header.WhatsNew')}
      </NavLink>
    );
  }
}
