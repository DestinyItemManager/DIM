import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable';
import { Subject } from 'rxjs/Subject';
import * as _ from 'lodash';
import {
  compareAccounts,
  DestinyAccount,
  getDestinyAccountsForBungieAccount
} from './destiny-account.service';
import '../rx-operators';
import { SyncService } from '../storage/sync.service';
import { getBungieAccount } from './bungie-account.service';
import * as actions from './actions';
import store from '../store/store';
import { loadingTracker } from '../shell/loading-tracker';
import { update } from '../inventory/actions';
import { goToLoginPage } from '../oauth/http-refresh-token.service';

let _platforms: DestinyAccount[] = [];
let _active: DestinyAccount | null = null;

// Set the active platform here - it'll drive the other observable
const activePlatform$ = new Subject<DestinyAccount>();

const current$: ConnectableObservable<DestinyAccount | null> = activePlatform$
  .distinctUntilChanged(compareAccounts)
  .do(saveActivePlatform)
  .publishReplay(1);

export function getPlatformMatching(params: Partial<DestinyAccount>): DestinyAccount | undefined {
  return _.find(_platforms, params);
}

// TODO: return a list of bungie accounts and associated destiny accounts?
export async function getPlatforms(): Promise<DestinyAccount[]> {
  if (_platforms.length) {
    return _platforms;
  }

  // TODO: wire this up with observables?
  const bungieAccount = getBungieAccount();
  if (!bungieAccount) {
    // We're not logged in, don't bother
    goToLoginPage();
    return [];
  }

  const membershipId = bungieAccount.membershipId;
  const promise = loadPlatforms(membershipId);
  loadingTracker.addPromise(promise);
  return promise;
}

async function loadPlatforms(membershipId: string) {
  const destinyAccounts = await getDestinyAccountsForBungieAccount(membershipId);
  _platforms = destinyAccounts;
  store.dispatch(actions.accountsLoaded(destinyAccounts));
  const platform = await loadActivePlatform();
  await setActivePlatform(platform);
  return _platforms;
}

export function getActivePlatform(): DestinyAccount | null {
  return _active;
}

export function setActivePlatform(platform: DestinyAccount | null) {
  if (platform) {
    activePlatform$.next(platform);
    return current$.take(1).toPromise();
  } else {
    return Promise.resolve(null);
  }
}

export function getActiveAccountStream() {
  current$.connect();
  return current$;
}

async function loadActivePlatform(): Promise<DestinyAccount | null> {
  if (_active) {
    return _active;
  }

  if (!_platforms.length) {
    return null;
  }

  const data = await SyncService.get();

  if (_active) {
    return _active;
  } else if (data && data.platformType) {
    let active = _platforms.find((platform) => {
      return (
        platform.platformType === data.platformType &&
        platform.destinyVersion === data.destinyVersion
      );
    });
    if (active) {
      return active;
    }
    active = _platforms.find((platform) => platform.platformType === data.platformType);
    if (active) {
      return active;
    }
  }
  return _platforms[0];
}

function saveActivePlatform(account: DestinyAccount | null): Promise<void> {
  // TODO: kill platform label
  _active = account;
  if (account === null) {
    return SyncService.remove('platformType');
  } else {
    // TODO: Starting to look like a saga
    store.dispatch(actions.setCurrentAccount(account));
    // Also clear inventory
    store.dispatch(update({ stores: [] }));

    return SyncService.set({
      platformType: account.platformType,
      destinyVersion: account.destinyVersion
    });
  }
}
