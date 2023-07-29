import { getGlobalAlerts } from 'app/bungie-api/bungie-core-api';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { updateBungieAlerts } from './actions';

let bungieAlertsLastUpdated = 0;

/**
 * Update Bungie alerts. Throttled to not run more often than once per 10 minutes.
 */
export function pollForBungieAlerts(): ThunkResult {
  return async (dispatch) => {
    if (Date.now() - bungieAlertsLastUpdated > 10 * 60 * 1000) {
      try {
        dispatch(updateBungieAlerts(await getGlobalAlerts()));
        bungieAlertsLastUpdated = Date.now();
      } catch (e) {
        errorLog('BungieAlerts', 'Unable to get Bungie.net alerts: ', e);
      }
    }
  };
}
