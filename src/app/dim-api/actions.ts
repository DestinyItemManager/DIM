import { createAction } from 'typesafe-actions';
import { GlobalSettings, getGlobalSettings } from 'app/dim-api/global-settings';
import { ThunkResult } from 'app/store/reducers';

/** Bulk update global settings after they've been loaded. */
export const settingsLoaded = createAction('dim-api/GLOBAL_SETTINGS_LOADED')<
  Partial<GlobalSettings>
>();

export function loadGlobalSettings(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    // TODO: better to use a state machine (UNLOADED => LOADING => LOADED)
    if (!getState().dimApi.settingsLoaded) {
      const globalSettings = await getGlobalSettings();
      console.log('globalSettings', globalSettings);
      dispatch(settingsLoaded(globalSettings));
    }
  };
}
