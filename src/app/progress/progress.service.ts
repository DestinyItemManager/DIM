import { DestinyProfileResponse, DestinyVendorsResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { compareAccounts, DestinyAccount } from '../accounts/destiny-account';
import { getProgression, getVendors } from '../bungie-api/destiny2-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { reportException } from '../utils/exceptions';
import { loadingTracker } from '../shell/loading-tracker';
import { showNotification } from '../notifications/notifications';
import { ConnectableObservable, Subject, ReplaySubject } from 'rxjs';
import {
  distinctUntilChanged,
  merge,
  filter,
  switchMap,
  publishReplay,
  take
} from 'rxjs/operators';

export interface ProgressService {
  getProgressStream(account: DestinyAccount): ConnectableObservable<ProgressProfile>;
  reloadProgress(): void;
}

// TODO: generate all the API structures from the Swagger docs
// This is a kind of radical approach - the result is not modified or interpreted until we get to components!
// Should allow for better understanding of updates, but prevents us from "correcting" and interpreting the data,
// and means we may have to block on defs lookup in the UI rendering :-/
export interface ProgressProfile {
  readonly profileInfo: DestinyProfileResponse;
  readonly vendors: { [characterId: string]: DestinyVendorsResponse };
}
// A subject that keeps track of the current account. Because it's a
// behavior subject, any new subscriber will always see its last
// value.
const accountStream: Subject<DestinyAccount> = new ReplaySubject<DestinyAccount>(1);

// The triggering observable for force-reloading progress.
const forceReloadTrigger = new Subject();

// A stream of progress that switches on account changes and supports reloading.
// This is a ConnectableObservable that must be connected to start.
const progressStream: ConnectableObservable<ProgressProfile> = accountStream.pipe(
  // Only emit when the account changes
  distinctUntilChanged(compareAccounts),
  // But also re-emit the current value of the account stream
  // whenever the force reload triggers
  merge(forceReloadTrigger.pipe(switchMap(() => accountStream.pipe(take(1))))),
  // Whenever either trigger happens, load progress
  switchMap(loadingTracker.trackPromise(loadProgress)),
  filter(Boolean),
  // Keep track of the last value for new subscribers
  publishReplay(1)
) as ConnectableObservable<ProgressProfile>;

/**
 * Set the current account, and get a stream of progress updates.
 * This will keep returning progress even if something else changes
 * the account by also calling "progressStream". This won't force the
 * progress to reload unless they haven't been loaded at all.
 *
 * @return a stream of store updates
 */
export function getProgressStream(account: DestinyAccount) {
  accountStream.next(account);
  // Start the stream the first time it's asked for. Repeated calls
  // won't do anything.
  progressStream.connect();
  return progressStream;
}

/**
 * Force the inventory and characters to reload.
 */
export function reloadProgress() {
  forceReloadTrigger.next(); // signal the force reload
}

async function loadProgress(account: DestinyAccount): Promise<ProgressProfile | undefined> {
  try {
    const profileInfo = await getProgression(account);
    const characterIds = profileInfo.characters.data
      ? Object.keys(profileInfo.characters.data)
      : [];
    let vendors: DestinyVendorsResponse[] = [];
    try {
      vendors = await Promise.all(
        characterIds.map((characterId) => getVendors(account, characterId))
      );
    } catch (e) {
      console.error('Failed to load vendors', e);
    }

    return {
      profileInfo,
      vendors: _.zipObject(characterIds, vendors) as ProgressProfile['vendors']
    };
  } catch (e) {
    showNotification(bungieErrorToaster(e));
    console.error('Error loading progress', e);
    reportException('progressService', e);
    // It's important that we swallow all errors here - otherwise
    // our observable will fail on the first error. We could work
    // around that with some rxjs operators, but it's easier to
    // just make this never fail.
    return undefined;
  }
}
