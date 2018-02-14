import { bungieApiQuery } from './bungie-api-utils';
import { $http } from 'ngimport';
import { IPromise } from 'angular';

export interface GlobalAlert {
  key: string;
  type: string;
  body: string;
  timestamp: string;
}

// http://destinydevs.github.io/BungieNetPlatform/docs/Enums
const GlobalAlertLevelsToToastLevels = [
  'info', // Unknown
  'info', // Blue
  'warn', // Yellow
  'error' // Red
];

/**
 * Get global alerts (like maintenance warnings) from Bungie.
 */
export function getGlobalAlerts(): IPromise<GlobalAlert[]> {
  return $http(bungieApiQuery(`/Platform/GlobalAlerts/`))
    .then((response: any) => {
      if (response && response.data && response.data.Response) {
        return response.data.Response.map((alert) => {
          return {
            key: alert.AlertKey,
            type: GlobalAlertLevelsToToastLevels[alert.AlertLevel],
            body: alert.AlertHtml,
            timestamp: alert.AlertTimestamp
          };
        });
      }
      return [];
    });
}
