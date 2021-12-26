import { getGlobalAlerts } from 'app/bungie-api/bungie-core-api';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { updateBungieAlerts } from './actions';

/**
 * Poll repeatedly for new Bungie alerts
 */
export function pollForBungieAlerts(): ThunkResult {
  return async (dispatch) => {
    setInterval(async () => {
      try {
        dispatch(updateBungieAlerts(await getGlobalAlerts()));
      } catch (e) {
        errorLog('BungieAlerts', 'Unable to get Bungie.net alerts: ', e);
      }
    }, 10 * 60 * 1000);
  };
}
