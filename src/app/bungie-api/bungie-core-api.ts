import { bungieApiQuery } from './bungie-api-utils';
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
export async function getGlobalAlerts(): Promise<GlobalAlert[]> {
  const response = await httpAdapter(bungieApiQuery(`/Platform/GlobalAlerts/`));
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
}
