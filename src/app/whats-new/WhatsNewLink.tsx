import { t } from 'app/i18next-t';
import { bungieAlertsSelector } from 'app/shell/selectors';
import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { useSubscription } from 'use-subscription';
import { dimNeedsUpdate$, reloadDIM } from '../register-service-worker';
import { AppIcon, updateIcon } from '../shell/icons';
import { GlobalAlertLevelsToToastLevels } from './BungieAlerts';
import { DimVersions } from './versions';
import './WhatsNewLink.scss';

/**
 * A link/button to the "What's New" page that highlights the most important action.
 */
export default function WhatsNewLink() {
  const showChangelog = useSubscription(DimVersions.showChangelog$);
  const alerts = useSelector(bungieAlertsSelector);
  const dimNeedsUpdate = useSubscription(dimNeedsUpdate$);

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
        <span
          className={`badge-new bungie-alert-${
            GlobalAlertLevelsToToastLevels[alerts[0].AlertLevel]
          }`}
        />{' '}
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
