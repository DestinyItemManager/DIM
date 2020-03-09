import { getGlobalSettings, getDimApiProfile, importData, postUpdates } from '../dim-api/dim-api';
import { ThunkResult, RootState } from '../store/reducers';
import { DimApiState } from './reducer';
import { get, set } from 'idb-keyval';
import { getPlatforms } from '../accounts/platforms';
import { currentAccountSelector } from '../accounts/reducer';
import { observeStore } from '../utils/redux-utils';
import _ from 'lodash';
import {
  globalSettingsLoaded,
  profileLoaded,
  profileLoadedFromIDB,
  ProfileIndexedDBState,
  finishedUpdates
} from './basic-actions';
import { initialState as initialSettingsState, Settings } from '../settings/reducer';
import { deepEqual } from 'fast-equals';
import { DimData, SyncService } from 'app/storage/sync.service';
import { ProfileUpdateWithRollback } from './api-types';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { readyResolve } from 'app/settings/settings';

/**
 * Watch the redux store and write out values to indexedDB.
 */
const saveProfileToIndexedDB = _.once(() =>
  observeStore(
    (state) => state.dimApi,
    _.debounce((currentState: DimApiState, nextState: DimApiState) => {
      // Avoid writing back what we just loaded from IDB
      // TODO: don't save to IDB while a save is in progress?
      if (currentState && currentState.profileLoadedFromIndexedDb) {
        // Only save the difference between the current and default settings
        const settingsToSave = subtractObject(nextState.settings, initialSettingsState) as Settings;

        const savedState: ProfileIndexedDBState = {
          settings: settingsToSave,
          profiles: nextState.profiles,
          updateQueue: nextState.updateQueue
        };
        console.log('Saving profile data to IDB');
        set('dim-api-profile', savedState);
      }
    }, 1000)
  )
);

// TODO: watch the queue to flush!
const observeUpdateQueue = _.once((dispatch: ThunkDispatch<RootState, {}, AnyAction>) =>
  observeStore(
    (state) => state.dimApi.updateQueue,
    _.debounce((_, queue: ProfileUpdateWithRollback[]) => {
      if (queue.length) {
        dispatch(flushUpdates());
      }
    }, 1000)
  )
);

/**
 * Load global API configuration from the server. This doesn't even require the user to be logged in.
 */
export function loadGlobalSettings(): ThunkResult<void> {
  return async (dispatch, getState) => {
    // TODO: better to use a state machine (UNLOADED => LOADING => LOADED)
    if (!getState().dimApi.globalSettingsLoaded) {
      try {
        const globalSettings = await getGlobalSettings();
        console.log('globalSettings', globalSettings);
        dispatch(globalSettingsLoaded(globalSettings));
      } catch (e) {
        console.error('Failed to load global settings from DIM API', e);
      }
    }
  };
}

/**
 * Load all API data (including global settings). This should be called at start and whenever the account is changed.
 */
// TODO: this should be a one-at-a-time action!
export function loadDimApiData(forceLoad = false): ThunkResult<void> {
  return async (dispatch, getState) => {
    const getPlatformsPromise = getPlatforms(); // in parallel, we'll wait later
    dispatch(loadProfileFromIndexedDB()); // In parallel, no waiting
    saveProfileToIndexedDB(); // idempotent
    observeUpdateQueue(dispatch); // idempotent

    if (!getState().dimApi.globalSettingsLoaded) {
      await dispatch(loadGlobalSettings());
    }

    // TODO: check API if it's out of date?
    // API is disabled, give up
    if (!getState().dimApi.globalSettings.dimApiEnabled) {
      return;
    }

    // TODO: load from gdrive, check for import
    const dimApiState = getState().dimApi;

    // TODO: don't load from remote if there is already an update queue from IDB?

    // TODO: check if profile is out of date, poll on a schedule?
    if (forceLoad || !dimApiState.profileLoaded) {
      // get current account
      const accounts = await getPlatformsPromise;
      if (!accounts) {
        // User isn't logged in or has no accounts, nothing to load!
        return;
      }
      const currentAccount = currentAccountSelector(getState());

      const profileResponse = await getDimApiProfile(currentAccount);
      readyResolve();
      dispatch(profileLoaded({ profileResponse, account: currentAccount }));
    }

    return dispatch(flushUpdates());
  };
}

// TODO: move this into redux if we want to show it?
let flushingUpdates = false;

/**
 * Process the queue of updates by sending them to the server
 */
export function flushUpdates(): ThunkResult<any> {
  return async (dispatch, getState) => {
    const queue = getState().dimApi.updateQueue;

    if (!flushingUpdates && queue.length) {
      console.log('TODO flush queue');
      // dispatch action to reset queue - how to keep track of which were sent and which weren't? just keep a number maybe

      try {
        // Only send one profile's worth at a time. Settings can go with anyone.
        const firstWithAccount = queue.find((u) => u.platformMembershipId) || queue[0];
        const updates = queue.filter(
          (u) =>
            !u.platformMembershipId ||
            (u.platformMembershipId === firstWithAccount.platformMembershipId &&
              u.destinyVersion === firstWithAccount.destinyVersion)
        );

        // TODO: maybe compact the queue here, and set state (also sort by account!)
        // Or just maintain a separate queue per account
        // dispatch(prepareForUpdates())

        // TODO: it'd be great if we could combine like requests (like settings)
        // Right now this results in tons of requests for things like changing the slider on item size
        // Probably need to have a watermark in the state for what we're flushing

        const results = await postUpdates(
          firstWithAccount.platformMembershipId,
          firstWithAccount.destinyVersion,
          updates
        );
        console.log('[flushUpdates] got results', updates, results);
        dispatch(finishedUpdates({ updates, results }));

        // Check for more!
        dispatch(flushUpdates());
      } catch (e) {
        console.error('[flushUpdates] Unable to save updates to DIM API', e);
        // I don't think we should try again right here
        // TODO: dispatch(updateFailed())
      } finally {
        flushingUpdates = false;
      }
    }
  };
}

export function loadProfileFromIndexedDB(): ThunkResult<any> {
  return async (dispatch, getState) => {
    // If we already got it from the server, don't bother
    if (getState().dimApi.profileLoaded || getState().dimApi.profileLoadedFromIndexedDb) {
      return;
    }

    const profile = await get<ProfileIndexedDBState | undefined>('dim-api-profile');

    // If we already got it from the server, don't bother
    if (getState().dimApi.profileLoaded || getState().dimApi.profileLoadedFromIndexedDb) {
      return;
    }

    dispatch(profileLoadedFromIDB(profile));
  };
}

/** Produce a new object that's only the key/values of obj that are also keys in defaults and which have values different from defaults. */
function subtractObject(obj: object | undefined, defaults: object) {
  const result = {};
  if (obj) {
    for (const key in defaults) {
      if (obj[key] !== undefined && !deepEqual(obj[key], defaults[key])) {
        result[key] = obj[key];
      }
    }
  }
  return result;
}

// TODO: Need a function to clear all data on logout?

export function importLegacyData(data: DimData, force = false): ThunkResult<any> {
  return async (dispatch, getState) => {
    const dimApiData = getState().dimApi;

    if (!dimApiData.globalSettings.dimApiEnabled) {
      return;
    }

    if (!dimApiData.profileLoaded) {
      // TODO: how to defer this?
      console.warn(
        "[importLegacyData] Skipping legacy data import because DIM API data isn't loaded yet"
      );
      // I guess wait for the thing to be ready. This could be a promise...
      const unsubscribe = observeStore(
        (state) => state.dimApi.profileLoaded,
        (_, loaded) => {
          if (loaded) {
            unsubscribe();
            dispatch(importLegacyData(data, force));
          }
        }
      );
      return;
    }

    if (
      !force &&
      Object.values(dimApiData.profiles).some((p) => p.loadouts?.length || p.tags?.length)
    ) {
      console.warn(
        '[importLegacyData] Skipping legacy data import because there are already loadouts or tags in the DIM API data'
      );
      return;
    }

    try {
      console.log('[importLegacyData] Attempting to import legacy data into DIM API');
      await importData(data);
      console.log('[importLegacyData] Successfully imported legacy data into DIM API');
    } catch (e) {
      console.error('[importLegacyData] Error importing legacy data into DIM API', e);
      return;
    }

    await SyncService.set({ importedToDimApi: true });

    // Reload from the server
    return dispatch(loadDimApiData(true));
  };
}
