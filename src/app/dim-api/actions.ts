import { createAction } from 'typesafe-actions';
import { getGlobalSettings } from 'app/dim-api/global-settings';
import { ThunkResult } from 'app/store/reducers';
import { GlobalSettings } from './api-types';

/** Bulk update global settings after they've been loaded. */
export const globalSettingsLoaded = createAction('dim-api/GLOBAL_SETTINGS_LOADED')<
  Partial<GlobalSettings>
>();

export function loadGlobalSettings(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    // TODO: better to use a state machine (UNLOADED => LOADING => LOADED)
    if (!getState().dimApi.globalSettingsLoaded) {
      const globalSettings = await getGlobalSettings();
      console.log('globalSettings', globalSettings);
      dispatch(globalSettingsLoaded(globalSettings));
    }
  };
}
