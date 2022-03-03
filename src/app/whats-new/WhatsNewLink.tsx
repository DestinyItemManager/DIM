import { t } from 'app/i18next-t';
import { dimNeedsUpdate$, reloadDIM } from 'app/register-service-worker';
import { AppIcon, updateIcon } from 'app/shell/icons';
import { bungieAlertsSelector } from 'app/shell/selectors';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { useSubscription } from 'use-subscription';
import { GlobalAlertLevelsToToastLevels } from './BungieAlerts';
import { DimVersions } from './versions';
import styles from './WhatsNewLink.m.scss';

/**
 * A link/button to the "What's New" page that highlights the most important action.
 */
export default function WhatsNewLink({
  className,
}: {
  className: (props: { isActive: boolean }) => string;
}) {
  const showChangelog = useSubscription(DimVersions.showChangelog$);
  const alerts = useSelector(bungieAlertsSelector);
  const dimNeedsUpdate = useSubscription(dimNeedsUpdate$);

  // TODO: use presstip/tooltip to help?
  // TODO: try dots and bottom-borders

  if (dimNeedsUpdate) {
    return (
      <a className={className({ isActive: false })} onClick={reloadDIM}>
        <AppIcon className={styles.upgrade} icon={updateIcon} />
        {t('Header.UpgradeDIM')}
      </a>
    );
  }

  if (alerts.length) {
    return (
      <NavLink to="/whats-new" className={className}>
        <span
          className={clsx(
            styles.badgeNew,
            `bungie-alert-${GlobalAlertLevelsToToastLevels[alerts[0].AlertLevel]}`
          )}
        />{' '}
        {t('Header.BungieNetAlert')}
      </NavLink>
    );
  }

  if (showChangelog) {
    return (
      <NavLink to="/whats-new" className={className}>
        <span className={styles.badgeNew} /> {t('Header.WhatsNew')}
      </NavLink>
    );
  }

  return (
    <NavLink to="/whats-new" className={className}>
      {t('Header.WhatsNew')}
    </NavLink>
  );
}
