import * as React from 'react';
import '../whats-new/WhatsNewLink.scss';
import './MenuBadge.scss';
import WhatsNewLink from '../whats-new/WhatsNewLink';

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
      return <i className="upgrade fa fa-arrow-circle-up" />;
    }

    if (alerts.length) {
      return <span className={`badge-new bungie-alert-${alerts[0].type}`} />;
    }

    if (showChangelog) {
      return <span className="badge-new" />;
    }

    return null;
  }
}
