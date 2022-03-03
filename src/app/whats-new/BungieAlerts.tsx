import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { bungieAlertsSelector } from 'app/shell/selectors';
import React from 'react';
import { useSelector } from 'react-redux';
import './BungieAlerts.scss';

// http://destinydevs.github.io/BungieNetPlatform/docs/Enums
export const GlobalAlertLevelsToToastLevels = [
  'info', // Unknown
  'info', // Blue
  'warn', // Yellow
  'error', // Red
];

/**
 * Displays maintenance alerts from Bungie.net.
 */
export default function BungieAlerts() {
  const alerts = useSelector(bungieAlertsSelector);

  return (
    <div className="bungie-alerts">
      {alerts.map((alert) => (
        <div
          key={alert.AlertKey}
          className={`bungie-alert bungie-alert-${
            GlobalAlertLevelsToToastLevels[alert.AlertLevel]
          }`}
        >
          <b>{t('BungieAlert.Title')}</b>
          <p dangerouslySetInnerHTML={{ __html: alert.AlertHtml }} />
          <div>
            {t('BungieService.Twitter')}{' '}
            <ExternalLink href="http://twitter.com/BungieHelp">@BungieHelp Twitter</ExternalLink>
          </div>
        </div>
      ))}
    </div>
  );
}
