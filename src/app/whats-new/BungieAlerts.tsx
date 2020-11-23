import { t } from 'app/i18next-t';
import { useSubscription } from 'app/utils/hooks';
import { GlobalAlert } from 'bungie-api-ts/core';
import { deepEqual } from 'fast-equals';
import React, { useState } from 'react';
import { EMPTY, from, timer } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { getGlobalAlerts } from '../bungie-api/bungie-core-api';
import ExternalLink from '../dim-ui/ExternalLink';
import './BungieAlerts.scss';

// http://destinydevs.github.io/BungieNetPlatform/docs/Enums
export const GlobalAlertLevelsToToastLevels = [
  'info', // Unknown
  'info', // Blue
  'warn', // Yellow
  'error', // Red
];

export const alerts$ = timer(0, 10 * 60 * 1000).pipe(
  // Fetch global alerts, but swallow errors
  switchMap(() => from(getGlobalAlerts()).pipe(catchError((_err) => EMPTY))),
  startWith<GlobalAlert[]>([]),
  // Deep equals
  distinctUntilChanged<GlobalAlert[]>(deepEqual),
  shareReplay()
);

/**
 * Displays maintenance alerts from Bungie.net.
 */
export default function BungieAlerts() {
  const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
  useSubscription(() => alerts$.subscribe(setAlerts));

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
