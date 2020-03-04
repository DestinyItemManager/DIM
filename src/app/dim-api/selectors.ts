import { RootState } from 'app/store/reducers';
import { createSelector } from 'reselect';
import { makeProfileKeyFromAccount } from './reducer';
import { currentAccountSelector } from 'app/accounts/reducer';

/**
 * Do we allow the user to save data (loadouts, tags, etc)? If they opt out we only let them save settings (and maybe only some of those)
 */
export const saveEnabledSelector = (state: RootState) =>
  !$featureFlags.dimApi ||
  (state.dimApi.apiPermissionGranted &&
    state.dimApi.globalSettings.dimApiEnabled &&
    (state.dimApi.profileLoaded || state.dimApi.profileLoadedFromIndexedDb));

/**
 * Return saved API data for the currently active profile (account).
 */
export const currentProfileSelector = createSelector(
  currentAccountSelector,
  (state: RootState) => state.dimApi.profiles,
  (currentAccount, profiles) =>
    currentAccount ? profiles[makeProfileKeyFromAccount(currentAccount)] : undefined
);
