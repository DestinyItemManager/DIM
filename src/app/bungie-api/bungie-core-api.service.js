import { bungieApiQuery } from './bungie-api-utils';

// http://destinydevs.github.io/BungieNetPlatform/docs/Enums
const GlobalAlertLevelsToToastLevels = [
  'info', // Unknown
  'info', // Blue
  'warn', // Yellow
  'error' // Red
];

/**
 * CoreService at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */
export function BungieCoreApi($http) {
  'ngInject';

  return {
    getGlobalAlerts
  };

  /**
   * Global notifications about Bungie.net and Destiny status.
   * @return {Array<{key, type, body, timestamp}>}
   */
  function getGlobalAlerts() {
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
}