import {
  DestinyCharacterComponent,
  DestinyCharacterProgressionComponent,
  DestinyInventoryComponent,
  DestinyItemComponentSetOfint64,
  DictionaryComponentResponse,
  SingleComponentResponse,
  DestinyProfileResponse
  } from 'bungie-api-ts/destiny2';
import { $q } from 'ngimport';
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';
import { compareAccounts, DestinyAccount } from '../accounts/destiny-account.service';
import { getProgression } from '../bungie-api/destiny2-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { reportException } from '../exceptions';
import { D2ManifestService } from '../manifest/manifest-service';
import { loadingTracker, toaster } from '../ngimport-more';
import '../rx-operators';
import { IPromise } from 'angular';

export interface ProgressService {
  getProgressStream(account: DestinyAccount): ConnectableObservable<ProgressProfile>;
  reloadProgress(): void;
}

/**
 * A slimmed down version of IDestinyProfileResponse for just what we get
 * TODO: Move all this into bungie-api.
 */
interface ProgressProfileResponse {
  characters: DictionaryComponentResponse<DestinyCharacterComponent>;
  characterProgressions: DictionaryComponentResponse<DestinyCharacterProgressionComponent>;
  profileInventory: SingleComponentResponse<DestinyInventoryComponent>;
  characterInventories: DictionaryComponentResponse<DestinyInventoryComponent>;
  itemComponents: DestinyItemComponentSetOfint64;
}

// TODO: generate all the API structures from the Swagger docs
// This is a kind of radical approach - the result is not modified or interpreted until we get to components!
// Should allow for better understanding of updates, but prevents us from "correcting" and interpreting the data,
// and means we may have to block on defs lookup in the UI rendering :-/
export interface ProgressProfile {
  readonly defs: D2ManifestDefinitions;
  readonly profileInfo: ProgressProfileResponse;
  /**
   * The date the most recently played character was last played.
   */
  readonly lastPlayedDate: Date;
}
// A subject that keeps track of the current account. Because it's a
// behavior subject, any new subscriber will always see its last
// value.
const accountStream: Subject<DestinyAccount> = new ReplaySubject<DestinyAccount>(1);

// The triggering observable for force-reloading progress.
const forceReloadTrigger = new Subject();

// A stream of progress that switches on account changes and supports reloading.
// This is a ConnectableObservable that must be connected to start.
const progressStream: ConnectableObservable<ProgressProfile> = accountStream
      // Only emit when the account changes
      .distinctUntilChanged(compareAccounts)
      // But also re-emit the current value of the account stream
      // whenever the force reload triggers
      .merge(forceReloadTrigger.switchMap(() => accountStream.take(1)))
      // Whenever either trigger happens, load progress
      .switchMap(loadProgress)
      .filter(Boolean)
      // Keep track of the last value for new subscribers
      .publishReplay(1);

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

function loadProgress(account: DestinyAccount): IPromise<ProgressProfile | undefined> {
  // TODO: this would be nicer as async/await, but we need the scope-awareness of the Angular promise for now
  const reloadPromise = $q.all([getProgression(account), getDefinitions()])
    .then(([profileInfo, defs]): ProgressProfile => {
      return {
        defs,
        profileInfo,
        get lastPlayedDate() {
          return Object.values((this.profileInfo as DestinyProfileResponse).characters.data).reduce((memo, character: DestinyCharacterComponent) => {
            const d1 = new Date(character.dateLastPlayed);
            return (memo) ? ((d1 >= memo) ? d1 : memo) : d1;
          }, new Date(0));
        }
      };
    })
    .catch((e) => {
      toaster.pop(bungieErrorToaster(e));
      console.error('Error loading progress', e);
      reportException('progressService', e);
      // It's important that we swallow all errors here - otherwise
      // our observable will fail on the first error. We could work
      // around that with some rxjs operators, but it's easier to
      // just make this never fail.
      return undefined;
    })
    .finally(() => {
      D2ManifestService.loaded = true;
    });

  loadingTracker.addPromise(reloadPromise);

  return reloadPromise;
}
