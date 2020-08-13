import _ from 'lodash';
import {
  compareAccounts,
  DestinyAccount,
  getDestinyAccountsForBungieAccount,
} from './destiny-account';
import { getBungieAccount } from './bungie-account';
import * as actions from './actions';
import { loadingTracker } from '../shell/loading-tracker';
import { goToLoginPage } from '../bungie-api/authenticated-fetch';
import { accountsSelector, currentAccountSelector, accountsLoadedSelector } from './selectors';
import { ThunkResult } from 'app/store/types';
import { dedupePromise } from 'app/utils/util';
import { removeToken } from '../bungie-api/oauth-tokens';
import { deleteDimApiToken } from 'app/dim-api/dim-api-helper';
import { del, get } from 'idb-keyval';

const loadAccountsFromIndexedDBAction: ThunkResult = dedupePromise(async (dispatch) => {
  console.log('Load accounts from IDB');
  const accounts = await get<DestinyAccount[] | undefined>('accounts');

  dispatch(actions.loadFromIDB(accounts || []));
});

const getPlatformsAction: ThunkResult<readonly DestinyAccount[]> = dedupePromise(
  async (dispatch, getState) => {
    let realAccountsPromise: Promise<readonly DestinyAccount[]> | null = null;
    if (!getState().accounts.loaded) {
      // Kick off a load from bungie.net in the background
      realAccountsPromise = dispatch(loadAccountsFromBungieNet());
    }

    if (!getState().accounts.loadedFromIDB) {
      try {
        await dispatch(loadAccountsFromIndexedDBAction);
      } catch (e) {
        console.error('Unable to load accounts from IDB', e);
      }
    }

    if (!accountsLoadedSelector(getState()) && realAccountsPromise) {
      // Fall back to Bungie.net
      try {
        await realAccountsPromise;
      } catch (e) {
        dispatch(actions.error(e));
        console.error('Unable to load accounts from Bungie.net', e);
      }
    }

    // Whatever we've got at this point is the answer
    const platform = await dispatch(loadActivePlatform());
    dispatch(setActivePlatform(platform));
    return accountsSelector(getState());
  }
);

export function getPlatforms(): ThunkResult<readonly DestinyAccount[]> {
  return getPlatformsAction;
}

const loadAccountsFromBungieNetAction: ThunkResult<readonly DestinyAccount[]> = dedupePromise(
  async (dispatch): Promise<readonly DestinyAccount[]> => {
    const bungieAccount = getBungieAccount();
    if (!bungieAccount) {
      // We're not logged in, don't bother
      goToLoginPage();
      return [];
    }

    const membershipId = bungieAccount.membershipId;
    const accounts = await loadingTracker.addPromise(dispatch(loadPlatforms(membershipId)));
    return accounts;
  }
);

function loadAccountsFromBungieNet(): ThunkResult<readonly DestinyAccount[]> {
  return loadAccountsFromBungieNetAction;
}

export function setActivePlatform(
  account: DestinyAccount | undefined
): ThunkResult<DestinyAccount | undefined> {
  return async (dispatch, getState) => {
    if (account) {
      const currentAccount = currentAccountSelector(getState());
      if (!currentAccount || !compareAccounts(currentAccount, account)) {
        localStorage.setItem('dim-last-membership-id', account.membershipId);
        localStorage.setItem('dim-last-destiny-version', account.destinyVersion.toString());
        dispatch(actions.setCurrentAccount(account));
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
        throw e;
      }
    }
    const destinyAccounts = accountsSelector(getState());
    return destinyAccounts;
  };
}

function loadActivePlatform(): ThunkResult<DestinyAccount | undefined> {
  return async (_dispatch, getState) => {
    const account = currentAccountSelector(getState());
    if (account) {
      return account;
    }

    const accounts = accountsSelector(getState());
    if (!accounts.length) {
      return undefined;
    }

    const membershipId = localStorage.getItem('dim-last-membership-id');
    const destinyVersionStr = localStorage.getItem('dim-last-destiny-version');
    const destinyVersion = destinyVersionStr ? parseInt(destinyVersionStr, 10) : 2;

    const active = accounts.find(
      (account) =>
        account.membershipId === membershipId && account.destinyVersion === destinyVersion
    );

    return active ?? _.maxBy(accounts, (account) => account.lastPlayed);
  };
}

export function logOut(): ThunkResult {
  return async (dispatch) => {
    removeToken();
    deleteDimApiToken();
    del('accounts'); // remove saved accounts from IDB
    dispatch(actions.loggedOut(true));
  };
}
