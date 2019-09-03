import _ from 'lodash';
import {
  compareAccounts,
  DestinyAccount,
  getDestinyAccountsForBungieAccount
} from './destiny-account.service';
import { SyncService } from '../storage/sync.service';
import { getBungieAccount } from './bungie-account.service';
import * as actions from './actions';
import store from '../store/store';
import { loadingTracker } from '../shell/loading-tracker';
import { goToLoginPage } from '../oauth/http-refresh-token.service';
import { accountsSelector, currentAccountSelector, loadAccountsFromIndexedDB } from './reducer';

let loadPlatformsPromise: Promise<readonly DestinyAccount[]> | null;

export async function getPlatforms(): Promise<readonly DestinyAccount[]> {
  if (loadPlatformsPromise) {
    return loadPlatformsPromise;
  }

  loadPlatformsPromise = (async () => {
    if (!store.getState().accounts.loadedFromIDB) {
      try {
        await ((store.dispatch(loadAccountsFromIndexedDB()) as any) as Promise<any>);
      } catch (e) {}
    }

    const state = store.getState();
    let accounts = accountsSelector(state);
    if (accounts.length && state.accounts.loaded) {
      return accounts;
    }

    const bungieAccount = getBungieAccount();
    if (!bungieAccount) {
      // We're not logged in, don't bother
      goToLoginPage();
      return [];
    }

    const membershipId = bungieAccount.membershipId;
    accounts = await loadingTracker.addPromise(loadPlatforms(membershipId));
    return accounts;
  })();

  return loadPlatformsPromise.finally(() => (loadPlatformsPromise = null));
}

export function getActivePlatform(): DestinyAccount | undefined {
  return currentAccountSelector(store.getState());
}

export async function setActivePlatform(account: DestinyAccount | undefined) {
  if (account) {
    const currentAccount = currentAccountSelector(store.getState());
    if (!currentAccount || !compareAccounts(currentAccount, account)) {
      saveActivePlatform(account);
    }
  }
  return account;
}

async function loadPlatforms(membershipId: string) {
  try {
    const destinyAccounts = await getDestinyAccountsForBungieAccount(membershipId);
    store.dispatch(actions.accountsLoaded(destinyAccounts));
  } catch (e) {
    if (!accountsSelector(store.getState()).length) {
      throw e;
    }
  }
  const destinyAccounts = accountsSelector(store.getState());
  const platform = await loadActivePlatform();
  await setActivePlatform(platform);
  return destinyAccounts;
}

async function loadActivePlatform(): Promise<DestinyAccount | undefined> {
  let account = currentAccountSelector(store.getState());
  if (account) {
    return account;
  }

  const accounts = accountsSelector(store.getState());
  if (!accounts.length) {
    return undefined;
  }

  const data = await SyncService.get();

  account = currentAccountSelector(store.getState());
  if (account) {
    return account;
  }

  if (data && data.membershipId) {
    const active = accounts.find((platform) => {
      return (
        platform.membershipId === data.membershipId &&
        platform.destinyVersion === data.destinyVersion
      );
    });
    if (active) {
      return active;
    }
  }

  return accounts[0];
}

function saveActivePlatform(account: DestinyAccount | undefined): Promise<void> {
  store.dispatch(actions.setCurrentAccount(account));
  if (account) {
    return SyncService.set({
      membershipId: account.membershipId,
      destinyVersion: account.destinyVersion
    });
  } else {
    return SyncService.remove(['platformType', 'membershipId', 'destinyVersion']);
  }
}
