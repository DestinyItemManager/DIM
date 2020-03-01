import { RootState } from 'app/store/reducers';

/**
 * Do we allow the user to save data (loadouts, tags, etc)? If they opt out we only let them save settings (and maybe only some of those)
 */
export const saveEnabledSelector = (state: RootState) =>
  !$featureFlags.dimApi ||
  (state.dimApi.apiPermissionGranted &&
    state.dimApi.globalSettings.dimApiEnabled &&
    (state.dimApi.profileLoaded || state.dimApi.profileLoadedFromIndexedDb));
