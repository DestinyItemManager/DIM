import * as _ from 'underscore';
import { Subject, ReplaySubject, ConnectableObservable } from '@reactivex/rxjs';
import { compareAccounts, DestinyAccount } from '../accounts/destiny-account.service';

export interface ProgressService {
  getProgressStream: (account: DestinyAccount) => ConnectableObservable<ProgressProfile>,
  reloadProgress: () => Promise<ProgressProfile>
}

/**
 * An object representing the various progress of a single character.
 */
interface CharacterProgress {
  character; // TODO: interface for our Character object
  factions;
  milestones;
  progressions;
  quests;
}

// TODO: generate all the API structures from the Swagger docs
interface ProgressProfile {
  characters: CharacterProgress[];
}

// TODO: use ngimport to break this free of Angular-ness
export function ProgressService(Destiny2Api: any, D2StoreFactory: any, D2Definitions: any) {
  'ngInject';

  // A subject that keeps track of the current account. Because it's a
  // behavior subject, any new subscriber will always see its last
  // value.
  const accountStream: Subject<DestinyAccount> = new ReplaySubject<DestinyAccount>(1);

  // The triggering observable for force-reloading progress.
  const forceReloadTrigger = new Subject();

  // A stream of progress that switches on account changes and supports reloading.
  // This is a ConnectableObservable that must be connected to start.
  const storesStream = accountStream
        // Only emit when the account changes
        .distinctUntilChanged(compareAccounts)
        // But also re-emit the current value of the account stream
        // whenever the force reload triggers
        .merge(forceReloadTrigger.switchMap(() => accountStream.take(1)))
        // Whenever either trigger happens, load progress
        .switchMap((account: DestinyAccount) => loadProgress(account))
        // Keep track of the last value for new subscribers
        .publishReplay(1);

  const service: ProgressService = {
    getProgressStream,
    reloadProgress
  };

  return service;

  /**
   * Set the current account, and get a stream of stores updates.
   * This will keep returning stores even if something else changes
   * the account by also calling "storesStream". This won't force the
   * stores to reload unless they haven't been loaded at all.
   *
   * @return {Observable} a stream of store updates
   */
  function getProgressStream(account: DestinyAccount) {
    accountStream.next(account);
    // Start the stream the first time it's asked for. Repeated calls
    // won't do anything.
    storesStream.connect();
    return storesStream;
  }

  /**
   * Force the inventory and characters to reload.
   * @return {Promise} the new stores
   */
  async function reloadProgress() {
    // adhere to the old contract by returning the next value as a
    // promise We take 2 from the stream because the publishReplay
    // will always return the latest value instantly, and we want the
    // next value (the refreshed value). toPromise returns the last
    // value in the sequence.
    const promise = storesStream.take(2).toPromise();
    forceReloadTrigger.next(); // signal the force reload
    return promise;
  }

  async function loadProgress(account: DestinyAccount): Promise<ProgressProfile> {
    const [profileInfo, defs] = await Promise.all([Destiny2Api.getProgression(account), D2Definitions.getDefinitions()]);
    const lastPlayedDate = findLastPlayedDate(profileInfo);

    // TODO: Could we just return this raw instead of transforming it??
    const characters = Object.keys(profileInfo.characters.data).map((characterId) => progressForCharacter(
      characterId,
      defs,
      profileInfo.characters.data[characterId],
      profileInfo.characterProgressions.data[characterId],
      lastPlayedDate!));

    /*
    D2StoreFactory.makeCharacter(defs, profileInfo.characters.data[characterId], lastPlayedDate)
    const characterProgresses = characters.map((character) => progressForCharacter(character, defs, profileInfo.characterProgressions.data[character.id]))
*/
    console.log(characters, profileInfo);
    return {
      characters
    };
  }

  function progressForCharacter(characterId: string, defs, characterData, progressionData, lastPlayedDate: Date): CharacterProgress {
    const character = D2StoreFactory.makeCharacter(defs, characterData, lastPlayedDate);

    return {
      character,
      factions,
      milestones,
      progressions,
      quests,

    }
  }

  /**
   * Find the date of the most recently played character.
   */
  function findLastPlayedDate(profileInfo) {
    return _.reduce(_.values(profileInfo.characters.data), (memo, character) => {
      const d1 = new Date(character.dateLastPlayed);
      return (memo) ? ((d1 >= memo!) ? d1 : memo) : d1;
    }, null);
  }
}