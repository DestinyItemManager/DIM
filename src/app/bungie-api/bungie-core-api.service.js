import { bungieApiQuery } from './bungie-api-utils';
import { $http } from 'ngimport';

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
export function getGlobalAlerts() {
  return $http(bungieApiQuery(`/Platform/GlobalAlerts/`))
    .then((response) => {
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
