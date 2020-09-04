import { t } from 'app/i18next-t';
import { useSubscription } from 'app/utils/hooks';
import { deepEqual } from 'fast-equals';
import React, { useState } from 'react';
import { empty, from, timer } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { getGlobalAlerts, GlobalAlert } from '../bungie-api/bungie-core-api';
import ExternalLink from '../dim-ui/ExternalLink';
import './BungieAlerts.scss';

export const alerts$ = timer(0, 10 * 60 * 1000).pipe(
  // Fetch global alerts, but swallow errors
  switchMap(() => from(getGlobalAlerts()).pipe(catchError((_err) => empty()))),
  startWith([] as GlobalAlert[]),
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
        <div key={alert.key} className={`bungie-alert bungie-alert-${alert.type}`}>
          <b>{t('BungieAlert.Title')}</b>
          <p dangerouslySetInnerHTML={{ __html: alert.body }} />
          <div>
            {t('BungieService.Twitter')}{' '}
            <ExternalLink href="http://twitter.com/BungieHelp">@BungieHelp Twitter</ExternalLink>
          </div>
        </div>
      ))}
    </div>
  );
}
