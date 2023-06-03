import { getGlobalAlerts } from 'app/bungie-api/bungie-core-api';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { updateBungieAlerts } from './actions';

/**
 * Update Bungie alerts. Throttled to not run more often than once per 10 minutes.
 */
export function pollForBungieAlerts(): ThunkResult {
  return async (dispatch, getState) => {
    if (Date.now() - getState().shell.bungieAlertsLastUpdated > 10 * 60 * 1000) {
      try {
        dispatch(updateBungieAlerts(await getGlobalAlerts()));
      } catch (e) {
        errorLog('BungieAlerts', 'Unable to get Bungie.net alerts: ', e);
      }
    }
  };
}
