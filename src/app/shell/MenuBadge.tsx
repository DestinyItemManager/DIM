import { dimNeedsUpdate$ } from 'app/register-service-worker';
import { GlobalAlertLevelsToToastLevels } from 'app/whats-new/BungieAlerts';
import { DimVersions } from 'app/whats-new/versions';
import React from 'react';
import { useSelector } from 'react-redux';
import { useSubscription } from 'use-subscription';
import '../whats-new/WhatsNewLink.scss';
import { AppIcon, updateIcon } from './icons';
import './MenuBadge.scss';
import { bungieAlertsSelector } from './selectors';

/**
 * A badge for the hamburger menu - must be kept in sync with WhatsNewLink, but may also incorporate other sources.
 *
 * Using inheritance to keep better in sync with WhatsNewLink.
 */
export default function MenuBadge() {
  // TODO: Incorporate settings/storage (e.g. DIM Sync disabled/busted)
  const showChangelog = useSubscription(DimVersions.showChangelog$);
  const alerts = useSelector(bungieAlertsSelector);
  const dimNeedsUpdate = useSubscription(dimNeedsUpdate$);

  if (dimNeedsUpdate) {
    return <AppIcon className="upgrade" icon={updateIcon} />;
  }

  if (alerts.length) {
    return (
      <span
        className={`badge-new bungie-alert-${GlobalAlertLevelsToToastLevels[alerts[0].AlertLevel]}`}
      />
    );
  }

  if (showChangelog) {
    return <span className="badge-new" />;
  }

  return null;
}
