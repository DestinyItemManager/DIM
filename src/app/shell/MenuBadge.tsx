import { dimNeedsUpdate$ } from 'app/register-service-worker';
import { GlobalAlertLevelsToToastLevels } from 'app/whats-new/BungieAlerts';
import { DimVersions } from 'app/whats-new/versions';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { useSubscription } from 'use-subscription';
import { AppIcon, updateIcon } from './icons';
import styles from './MenuBadge.m.scss';
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
    return <AppIcon className={styles.upgrade} icon={updateIcon} />;
  }

  if (alerts.length) {
    return (
      <span
        className={clsx(
          styles.badgeNew,
          `bungie-alert-${GlobalAlertLevelsToToastLevels[alerts[0].AlertLevel]}`
        )}
      />
    );
  }

  if (showChangelog) {
    return <span className={styles.badgeNew} />;
  }

  return null;
}
