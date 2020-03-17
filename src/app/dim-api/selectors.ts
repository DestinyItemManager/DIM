import { RootState } from 'app/store/reducers';
import { createSelector } from 'reselect';
import { makeProfileKeyFromAccount } from './reducer';
import { currentAccountSelector } from 'app/accounts/reducer';

export const apiPermissionGrantedSelector = (state: RootState) =>
  state.dimApi.apiPermissionGranted === true;

/**
 * Return saved API data for the currently active profile (account).
 */
export const currentProfileSelector = createSelector(
  currentAccountSelector,
  (state: RootState) => state.dimApi.profiles,
  (currentAccount, profiles) =>
    currentAccount ? profiles[makeProfileKeyFromAccount(currentAccount)] : undefined
);
