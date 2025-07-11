import { FatalTokenError } from 'app/bungie-api/authenticated-fetch';
import { ThunkResult } from 'app/store/types';
import { DimError } from 'app/utils/dim-error';
import { createAction } from 'typesafe-actions';
import { DestinyAccount } from './destiny-account';

export const accountsLoaded = createAction('accounts/ACCOUNTS_LOADED')<DestinyAccount[]>();
export const setCurrentAccount = createAction('accounts/SET_CURRENT_ACCOUNT')<DestinyAccount>();

export const loadFromIDB = createAction('accounts/LOAD_FROM_IDB')<DestinyAccount[]>();

export const error = createAction('accounts/ERROR')<Error>();

export const loggedOut = createAction('accounts/LOG_OUT')();

export const needsDeveloper = createAction('accounts/DEV_INFO_NEEDED')();

/**
 * Inspect an error and potentially log out the user or send them to the developer page
 */
export function handleAuthErrors(e: unknown): ThunkResult {
  return async (dispatch) => {
    // This means we don't have an API key or the API key is wrong
    if ($DIM_FLAVOR === 'dev' && e instanceof DimError && e.code === 'BungieService.DevVersion') {
      dispatch(needsDeveloper());
    } else if (
      e instanceof Error &&
      (e instanceof FatalTokenError ||
        (e instanceof DimError &&
          (e.code === 'BungieService.NotLoggedIn' || e.cause instanceof FatalTokenError)))
    ) {
      dispatch(loggedOut());
    }
  };
}
