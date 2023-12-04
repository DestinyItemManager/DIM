import { t } from 'app/i18next-t';
import { bungieHelpAccount, bungieHelpLink } from 'app/shell/links';
import { bungieAlertsSelector } from 'app/shell/selectors';
import { GlobalAlertLevel } from 'bungie-api-ts/core';
import { useSelector } from 'react-redux';
import ExternalLink from '../dim-ui/ExternalLink';
import styles from './BungieAlerts.m.scss';

// http://destinydevs.github.io/BungieNetPlatform/docs/Enums
export const GlobalAlertLevelsToToastLevels = [
  'info', // Unknown
  'info', // Blue
  'warn', // Yellow
  'error', // Red
];

const AlertLevelStyles = {
  [GlobalAlertLevel.Unknown]: styles.info,
  [GlobalAlertLevel.Blue]: styles.info,
  [GlobalAlertLevel.Yellow]: styles.warn,
  [GlobalAlertLevel.Red]: styles.error,
};

/**
 * Displays maintenance alerts from Bungie.net.
 */
export default function BungieAlerts() {
  const alerts = useSelector(bungieAlertsSelector);

  return (
    <div>
      {alerts.map((alert) => (
        <div key={alert.AlertKey} className={AlertLevelStyles[alert.AlertLevel]}>
          <h2>{t('BungieAlert.Title')}</h2>
          <p dangerouslySetInnerHTML={{ __html: alert.AlertHtml }} />
          <div>
            {t('BungieService.Twitter')}{' '}
            <ExternalLink href={bungieHelpLink}>{bungieHelpAccount}</ExternalLink>
          </div>
        </div>
      ))}
    </div>
  );
}
