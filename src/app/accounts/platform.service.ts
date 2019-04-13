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
import { accountsSelector, currentAccountSelector } from './reducer';

export async function getPlatforms(): Promise<readonly DestinyAccount[]> {
  let accounts = accountsSelector(store.getState());
  if (accounts.length) {
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
  const destinyAccounts = await getDestinyAccountsForBungieAccount(membershipId);
  store.dispatch(actions.accountsLoaded(destinyAccounts));
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
  } else if (data && data.platformType) {
    let active = accounts.find((platform) => {
      return (
        platform.platformType === data.platformType &&
        platform.destinyVersion === data.destinyVersion
      );
    });
    if (active) {
      return active;
    }
    active = accounts.find((platform) => platform.platformType === data.platformType);
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
      platformType: account.platformType,
      destinyVersion: account.destinyVersion
    });
  } else {
    return SyncService.remove('platformType');
  }
}
