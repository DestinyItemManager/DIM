import { loadDimApiData } from 'app/dim-api/actions';
import { deleteDimApiToken } from 'app/dim-api/dim-api-helper';
import { del, get } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { convertToError } from 'app/utils/errors';
import { errorLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/promises';
import { removeToken } from '../bungie-api/oauth-tokens';
import { loadingTracker } from '../shell/loading-tracker';
import * as actions from './actions';
import { getBungieAccount } from './bungie-account';
import {
  DestinyAccount,
  compareAccounts,
  getDestinyAccountsForBungieAccount,
} from './destiny-account';
import { accountsLoadedSelector, accountsSelector, currentAccountSelector } from './selectors';

const loadAccountsFromIndexedDBAction: ThunkResult = dedupePromise(async (dispatch) => {
  const accounts = await get<DestinyAccount[] | undefined>('accounts');
  dispatch(actions.loadFromIDB(accounts || []));
});

/**
 * Load data about available accounts.
 */
export const getPlatforms: ThunkResult = dedupePromise(async (dispatch, getState) => {
  let realAccountsPromise: Promise<readonly DestinyAccount[]> | null = null;
  if (!getState().accounts.loaded) {
    // Kick off a load from bungie.net in the background
    realAccountsPromise = dispatch(loadAccountsFromBungieNet());
  }

  if (!getState().accounts.loadedFromIDB) {
    try {
      await dispatch(loadAccountsFromIndexedDBAction);
    } catch (e) {
      errorLog('accounts', 'Unable to load accounts from IDB', e);
    }
  }

  if (!accountsLoadedSelector(getState()) && realAccountsPromise) {
    // Fall back to Bungie.net
    try {
      await realAccountsPromise;
    } catch (e) {
      dispatch(actions.error(convertToError(e)));
      errorLog('accounts', 'Unable to load accounts from Bungie.net', e);
    }
  }
});

const loadAccountsFromBungieNetAction: ThunkResult<readonly DestinyAccount[]> = dedupePromise(
  async (dispatch): Promise<readonly DestinyAccount[]> => {
    const bungieAccount = getBungieAccount();
    if (!bungieAccount) {
      // We're not logged in, don't bother
      dispatch(actions.loggedOut());
      return [];
    }

    const membershipId = bungieAccount.membershipId;
    return loadingTracker.addPromise(dispatch(loadPlatforms(membershipId)));
  },
);

function loadAccountsFromBungieNet(): ThunkResult<readonly DestinyAccount[]> {
  return loadAccountsFromBungieNetAction;
}

/**
 * Switch the current account to the given account. Lots of things depend on the current account
 * to calculate their info. This also saves information about the last used account so we can restore
 * it next time. This should be called when switching accounts or navigating to an account-specific page.
 */
export function setActivePlatform(
  account: DestinyAccount | undefined,
): ThunkResult<DestinyAccount | undefined> {
  return async (dispatch, getState) => {
    if (account) {
      const currentAccount = currentAccountSelector(getState());
      if (!currentAccount || !compareAccounts(currentAccount, account)) {
        localStorage.setItem('dim-last-membership-id', account.membershipId);
        localStorage.setItem('dim-last-destiny-version', account.destinyVersion.toString());
        dispatch(actions.setCurrentAccount(account));
        dispatch(loadDimApiData());
      }
    }
    return account;
  };
}

function loadPlatforms(membershipId: string): ThunkResult<readonly DestinyAccount[]> {
  return async (dispatch, getState) => {
    try {
      const destinyAccounts = await dispatch(getDestinyAccountsForBungieAccount(membershipId));
      dispatch(actions.accountsLoaded(destinyAccounts));
    } catch (e) {
      if (!accountsSelector(getState()).length) {
        dispatch(actions.handleAuthErrors(e));
        throw e;
      }
    }
    return accountsSelector(getState());
  };
}

export function logOut(): ThunkResult {
  return async (dispatch) => {
    removeToken();
    deleteDimApiToken();
    localStorage.removeItem('dim-last-membership-id');
    localStorage.removeItem('dim-last-destiny-version');
    del('accounts'); // remove saved accounts from IDB

    dispatch(actions.loggedOut());
  };
}
