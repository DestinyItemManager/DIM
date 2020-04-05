import _ from 'lodash';
import {
  compareAccounts,
  DestinyAccount,
  getDestinyAccountsForBungieAccount
} from './destiny-account';
import { getBungieAccount } from './bungie-account';
import * as actions from './actions';
import store from '../store/store';
import { loadingTracker } from '../shell/loading-tracker';
import { goToLoginPage } from '../bungie-api/authenticated-fetch';
import { accountsSelector, currentAccountSelector, loadAccountsFromIndexedDB } from './reducer';
import { ThunkResult } from 'app/store/reducers';
import { dedupePromise } from 'app/utils/util';

const getPlatformsAction: ThunkResult<readonly DestinyAccount[]> = dedupePromise(
  async (dispatch, getState) => {
    let realAccountsPromise: Promise<readonly DestinyAccount[]> | null = null;
    if (!getState().accounts.loaded) {
      // Kick off a load from bungie.net in the background
      realAccountsPromise = dispatch(loadAccountsFromBungieNet());
    }

    if (!getState().accounts.loadedFromIDB) {
      try {
        await dispatch(loadAccountsFromIndexedDB());
      } catch (e) {
        console.error('Unable to load accounts from IDB', e);
      }
    }

    if (!getState().accounts.loadedFromIDB && !getState().accounts.loaded && realAccountsPromise) {
      // Fall back to Bungie.net
      await realAccountsPromise;
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

// TODO: get rid of this
export function getActivePlatform(): DestinyAccount | undefined {
  return currentAccountSelector(store.getState());
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
      const destinyAccounts = await getDestinyAccountsForBungieAccount(membershipId);
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
  return async (_, getState) => {
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

    return active ?? accounts[0];
  };
}
