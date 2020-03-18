import {
  getGlobalSettings,
  getDimApiProfile,
  importData,
  postUpdates,
  deleteAllData
} from '../dim-api/dim-api';
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
  finishedUpdates,
  prepareToFlushUpdates,
  flushUpdatesFailed,
  allDataDeleted,
  setApiPermissionGranted
} from './basic-actions';
import { deepEqual } from 'fast-equals';
import { DimData, SyncService } from 'app/storage/sync.service';
import { ProfileUpdateWithRollback } from './api-types';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { readyResolve } from 'app/settings/settings';
import { delay } from 'app/utils/util';
import { apiPermissionGrantedSelector } from './selectors';
import { promptForApiPermission } from './api-permission-prompt';
import { initialSettingsState, Settings } from 'app/settings/initial-settings';
import { showNotification } from 'app/notifications/notifications';
import { t } from 'app/i18next-t';

/**
 * Watch the redux store and write out values to indexedDB.
 */
const saveProfileToIndexedDB = _.once(() => {
  observeStore(
    (state) => state.dimApi,
    _.debounce((currentState: DimApiState, nextState: DimApiState) => {
      // Avoid writing back what we just loaded from IDB
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
  );
});

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
// TODO: reload on page visibility changes, timer?
export function loadDimApiData(forceLoad = false): ThunkResult<void> {
  return async (dispatch, getState) => {
    const getPlatformsPromise = getPlatforms(); // in parallel, we'll wait later
    dispatch(loadProfileFromIndexedDB()); // In parallel, no waiting
    saveProfileToIndexedDB(); // idempotent
    observeUpdateQueue(dispatch); // idempotent

    if (!getState().dimApi.globalSettingsLoaded) {
      await dispatch(loadGlobalSettings());
    }

    // API is disabled, give up
    if (!getState().dimApi.globalSettings.dimApiEnabled) {
      return;
    }

    // Show a prompt if the user has not said one way or another whether they want to use the API
    if (getState().dimApi.apiPermissionGranted === null) {
      const useApi = await promptForApiPermission();
      dispatch(setApiPermissionGranted(useApi));
      if (useApi) {
        showBackupDownloadedNotification();
      }
    }

    if (!getState().dimApi.apiPermissionGranted) {
      // OK, they don't want to use DIM Sync...
      return;
    }

    // don't load from remote if there is already an update queue from IDB - we'd roll back data otherwise!
    if (getState().dimApi.updateQueue.length > 0) {
      await dispatch(flushUpdates()); // flushUpdates will call loadDimApiData again at the end
      return;
    }

    if (forceLoad || !getState().dimApi.profileLoaded) {
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

    // Make sure any queued updates get sent to the server
    await dispatch(flushUpdates());

    // Check to see if legacy data needs to be auto-imported
    await dispatch(importLegacyData());
  };
}

// Backoff multiplier
let backoff = 0;

/**
 * Process the queue of updates by sending them to the server
 */
export function flushUpdates(): ThunkResult<any> {
  return async (dispatch, getState) => {
    let dimApiState = getState().dimApi;

    if (dimApiState.updateInProgressWatermark === 0 && dimApiState.updateQueue.length > 0) {
      // Prepare the queue
      dispatch(prepareToFlushUpdates());
      dimApiState = getState().dimApi;

      if (dimApiState.updateInProgressWatermark === 0) {
        return;
      }

      console.log(
        '[flushUpdates] Flushing queue of',
        dimApiState.updateInProgressWatermark,
        'updates'
      );

      // Only select the items that were frozen for update. They're guaranteed
      // to not change while we're updating and they'll be for a single profile.
      const updates = dimApiState.updateQueue.slice(0, dimApiState.updateInProgressWatermark);

      try {
        const firstWithAccount = updates.find((u) => u.platformMembershipId) || updates[0];

        const results = await postUpdates(
          firstWithAccount.platformMembershipId,
          firstWithAccount.destinyVersion,
          updates
        );
        console.log('[flushUpdates] got results', updates, results);

        // Quickly heal from being failure backoff
        backoff = Math.floor(backoff / 2);

        dispatch(finishedUpdates(results));
      } catch (e) {
        console.error('[flushUpdates] Unable to save updates to DIM API', e);

        // Wait, with exponential backoff - we'll try infinitely otherwise, in a tight loop!
        // Double the wait time, starting with 5 seconds, until we reach 5 minutes.
        const waitTime = Math.min(5 * 60 * 1000, Math.pow(2, backoff) * 2500);
        console.log('[flushUpdates] Waiting', waitTime, 'ms before re-attempting updates');
        await delay(waitTime);

        // Now mark the queue failed so it can be retried. Until
        // updateInProgressWatermark gets reset no other flushUpdates call will
        // do anything.
        dispatch(flushUpdatesFailed());
      } finally {
        dimApiState = getState().dimApi;
        if (dimApiState.updateQueue.length > 0) {
          // Flush more updates!
          dispatch(flushUpdates());
        } else if (!dimApiState.profileLoaded) {
          // Load API data in case we didn't do it before
          dispatch(loadDimApiData());
        }
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

/** Returns a promise that resolves when the profile is fully loaded. */
function waitForProfileLoad() {
  return new Promise((resolve) => {
    const unsubscribe = observeStore(
      (state) => state.dimApi.profileLoaded,
      (_, loaded) => {
        if (loaded) {
          unsubscribe();
          resolve();
        }
      }
    );
  });
}

export function importLegacyData(data?: DimData, force = false): ThunkResult<any> {
  return async (dispatch, getState) => {
    if (!data) {
      data = await SyncService.get();
    }

    let dimApiData = getState().dimApi;

    if (!dimApiData.globalSettings.dimApiEnabled) {
      return;
    }

    if (!dimApiData.profileLoaded) {
      await waitForProfileLoad();
    }

    if (!force && data.importedToDimApi) {
      console.log("[importLegacyData] Don't need to import, this legacy data has already imported");
      return;
    }

    // Check to see if there's anything to import - don't want to start a brand new user out with importing.
    if (isLegacyDataEmpty(data)) {
      console.log(
        "[importLegacyData] Don't need to import, there are no settings, tags or loadouts in the legacy data"
      );
      // Silently return
      return;
    }

    dimApiData = getState().dimApi;

    if (
      (!force &&
        Object.values(dimApiData.profiles).some((p) => p.loadouts?.length || p.tags?.length)) ||
      !_.isEmpty(subtractObject(dimApiData.settings, initialSettingsState))
    ) {
      console.warn(
        '[importLegacyData] Skipping legacy data import because there are already settings, loadouts or tags in the DIM API profile data'
      );

      // Mark in the legacy data that this has been imported already
      await SyncService.set({ importedToDimApi: true });
      showImportSkippedNotification();
      return;
    }

    try {
      console.log('[importLegacyData] Attempting to import legacy data into DIM API');
      const result = await importData(data);
      console.log('[importLegacyData] Successfully imported legacy data into DIM API');
      showImportSuccessNotification(result);
    } catch (e) {
      console.error('[importLegacyData] Error importing legacy data into DIM API', e);
      return;
    }

    // Mark in the legacy data that this has been imported already
    await SyncService.set({ importedToDimApi: true });

    // Reload from the server
    return dispatch(loadDimApiData(true));
  };
}

export function deleteAllApiData(): ThunkResult<any> {
  return async (dispatch, getState) => {
    const result = await deleteAllData();

    // If they have the API enabled, also clear out everything locally. Otherwise we'll just clear out the remote data.
    if (apiPermissionGrantedSelector(getState())) {
      dispatch(allDataDeleted());
    }

    return result;
  };
}

/** Does the legacy data contain any settings, loadouts or tags? */
function isLegacyDataEmpty(data: DimData) {
  if (data['loadouts-v3.0']?.length) {
    return false;
  }

  for (const key in importData) {
    const match = /dimItemInfo-m(\d+)-d(1|2)/.exec(key);
    if (match && !_.isEmpty(importData[key])) {
      return false;
    }
  }

  if (!_.isEmpty(subtractObject(data['settings-v1.0'], initialSettingsState))) {
    return false;
  }

  return true;
}

function showBackupDownloadedNotification() {
  showNotification({
    type: 'success',
    title: t('Storage.DimSyncEnabled'),
    body: t('Storage.AutoBackup')
  });
}

function showImportSkippedNotification() {
  showNotification({
    type: 'warning',
    title: t('Storage.ImportNotification.SkippedTitle'),
    body: t('Storage.ImportNotification.SkippedBody')
  });
}

function showImportSuccessNotification(result: { loadouts: number; tags: number }) {
  showNotification({
    type: 'success',
    title: t('Storage.ImportNotification.SuccessTitle'),
    body: t('Storage.ImportNotification.SuccessBody', result)
  });
}
