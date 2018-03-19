import { IPromise, IHttpResponse } from 'angular';
import { $http } from 'ngimport';
import { bungieApiQuery } from './bungie-api-utils';
import { ServerResponse } from 'bungie-api-ts/common';

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
    .then((response: IHttpResponse<ServerResponse<any>>) => {
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
