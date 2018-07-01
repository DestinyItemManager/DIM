import { bungieApiQuery } from './bungie-api-utils';
import { ServerResponse } from 'bungie-api-ts/common';
import { httpAdapter } from './bungie-service-helper';

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
export function getGlobalAlerts(): Promise<GlobalAlert[]> {
  return httpAdapter(bungieApiQuery(`/Platform/GlobalAlerts/`))
    .then((response: ServerResponse<any>) => {
      if (response && response.Response) {
        return response.Response.map((alert) => {
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
