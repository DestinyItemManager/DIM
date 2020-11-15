import { GlobalAlertLevelsToToastLevels } from 'app/whats-new/BungieAlerts';
import React from 'react';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import '../whats-new/WhatsNewLink.scss';
import { AppIcon, updateIcon } from './icons';
import './MenuBadge.scss';

/**
 * A badge for the hamburger menu - must be kept in sync with WhatsNewLink, but may also incorporate other sources.
 *
 * Using inheritance to keep better in sync with WhatsNewLink.
 */
export default class MenuBadge extends WhatsNewLink {
  render() {
    // TODO: Incorporate settings/storage
    const { dimNeedsUpdate, alerts, showChangelog } = this.state;

    if (dimNeedsUpdate) {
      return <AppIcon className="upgrade" icon={updateIcon} />;
    }

    if (alerts.length) {
      return (
        <span
          className={`badge-new bungie-alert-${
            GlobalAlertLevelsToToastLevels[alerts[0].AlertLevel]
          }`}
        />
      );
    }

    if (showChangelog) {
      return <span className="badge-new" />;
    }

    return null;
  }
}
