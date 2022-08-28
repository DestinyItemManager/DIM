import { DeleteAllResponse } from '@destinyitemmanager/dim-api-types';
import { needsDeveloper } from 'app/accounts/actions';
import { compareAccounts } from 'app/accounts/destiny-account';
import { currentAccountSelector } from 'app/accounts/selectors';
import { getActiveToken as getBungieToken } from 'app/bungie-api/authenticated-fetch';
import { dimErrorToaster } from 'app/bungie-api/error-toaster';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { initialSettingsState, Settings } from 'app/settings/initial-settings';
import { readyResolve } from 'app/settings/settings';
import { refresh$ } from 'app/shell/refresh-events';
import { get, set } from 'app/storage/idb-keyval';
import { RootState, ThunkResult } from 'app/store/types';
import { errorLog, infoLog } from 'app/utils/log';
import { delay } from 'app/utils/util';
import { deepEqual } from 'fast-equals';
import _ from 'lodash';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { getPlatforms } from '../accounts/platforms';
import {
  deleteAllData,
  getDimApiProfile,
  getGlobalSettings,
  postUpdates,
} from '../dim-api/dim-api';
import { observeStore } from '../utils/redux-utils';
import { promptForApiPermission } from './api-permission-prompt';
import { ProfileUpdateWithRollback } from './api-types';
import {
  allDataDeleted,
  finishedUpdates,
  flushUpdatesFailed,
  globalSettingsLoaded,
  prepareToFlushUpdates,
  ProfileIndexedDBState,
  profileLoaded,
  profileLoadedFromIDB,
  profileLoadError,
  setApiPermissionGranted,
} from './basic-actions';
import { DimApiState } from './reducer';
import { apiPermissionGrantedSelector } from './selectors';

const installApiPermissionObserver = _.once(() => {
  // Observe API permission and reflect it into local storage
  // We could also use a thunk action instead of an observer... either way
  observeStore(
    (state) => state.dimApi.apiPermissionGranted,
    (_prev, apiPermissionGranted) => {
      if (apiPermissionGranted !== null) {
        // Save the permission preference to local storage
        localStorage.setItem('dim-api-enabled', apiPermissionGranted ? 'true' : 'false');
      }
    }
  );
});

/**
 * Watch the redux store and write out values to indexedDB, etc.
 */
const installObservers = _.once((dispatch: ThunkDispatch<RootState, undefined, AnyAction>) => {
  // Watch the state and write it out to IndexedDB
  observeStore(
    (state) => state.dimApi,
    _.debounce((currentState: DimApiState, nextState: DimApiState) => {
      if (
        // Avoid writing back what we just loaded from IDB
        currentState?.profileLoadedFromIndexedDb &&
        // Check to make sure one of the fields we care about has changed
        (nextState.settings !== currentState.settings ||
          nextState.profiles !== currentState.profiles ||
          nextState.updateQueue !== currentState.updateQueue ||
          nextState.itemHashTags !== currentState.itemHashTags ||
          nextState.searches !== currentState.searches)
      ) {
        // Only save the difference between the current and default settings
        const settingsToSave = subtractObject(nextState.settings, initialSettingsState) as Settings;

        const savedState: ProfileIndexedDBState = {
          settings: settingsToSave,
          profiles: nextState.profiles,
          updateQueue: nextState.updateQueue,
          itemHashTags: nextState.itemHashTags,
          searches: nextState.searches,
        };
        infoLog('dim sync', 'Saving profile data to IDB');
        set('dim-api-profile', savedState);
      }
    }, 1000)
  );

  // Watch the update queue and flush updates
  observeStore(
    (state) => state.dimApi.updateQueue,
    _.debounce((_prev, queue: ProfileUpdateWithRollback[]) => {
      if (queue.length) {
        dispatch(flushUpdates());
      }
    }, 1000)
  );

  // Observe the current account and reload data
  // Another one that should probably be a thunk action once account transitions are actions
  observeStore(currentAccountSelector, (oldAccount, newAccount) => {
    // Force load profile data if the account changed
    if (oldAccount && newAccount && !compareAccounts(oldAccount, newAccount)) {
      dispatch(loadDimApiData(true));
    }
  });

  // Every time data is refreshed, maybe load DIM API data too
  refresh$.subscribe(() => dispatch(loadDimApiData()));
});

/**
 * Load global API configuration from the server. This doesn't even require the user to be logged in.
 */
function loadGlobalSettings(): ThunkResult {
  return async (dispatch, getState) => {
    // TODO: better to use a state machine (UNLOADED => LOADING => LOADED)
    if (!getState().dimApi.globalSettingsLoaded) {
      try {
        const globalSettings = await getGlobalSettings();
        infoLog('dim sync', 'globalSettings', globalSettings);
        dispatch(globalSettingsLoaded(globalSettings));
      } catch (e) {
        errorLog('dim sync', 'Failed to load global settings from DIM API', e);
      }
    }
  };
}

/**
 * Wait, with exponential backoff - we'll try infinitely otherwise, in a tight loop!
 * Double the wait time, starting with 30 seconds, until we reach 5 minutes.
 */
function getBackoffWaitTime(backoff: number) {
  // Don't wait less than 10 seconds or more than 10 minutes
  return Math.max(10_000, Math.min(10 * 60 * 1000, Math.random() * Math.pow(2, backoff) * 15_000));
}

// Backoff multiplier
let getProfileBackoff = 0;
let waitingForApiPermission = false;

/**
 * Load all API data (including global settings). This should be called at start
 * and whenever the account is changed. It's also called whenever stores refresh
 * (via the refresh button or when auto refresh triggers). This action is meant
 * to be called repeatedly and be idempotent.
 *
 * Note that we block loading the manifest on this, because we need the user's
 * settings in order to choose the right language.
 *
 * TODO: If we can replace the manifest after load, maybe we just load using the
 * default language and switch it if the language in settings is different.
 *
 * This action drives a workflow for onboarding to DIM Sync, as well. We check
 * for whether the user has opted in to Sync, and if they haven't, we prompt.
 * Usually they already made their choice at login, though.
 */
export function loadDimApiData(forceLoad = false): ThunkResult {
  return async (dispatch, getState) => {
    installApiPermissionObserver();

    // Load global settings first. This fails open (we fall back to defaults)
    // but loading it first gives us a chance to find out if the API is disabled
    // and what the current refresh rate is, which gives us important
    // operational controls in case the API is knocked over.
    if (!getState().dimApi.globalSettingsLoaded) {
      await dispatch(loadGlobalSettings());
    }

    // Check if we're even logged into Bungie.net. Don't need to load or sync if not.
    const bungieToken = await getBungieToken();
    if (!bungieToken) {
      return;
    }

    // Don't let actions pile up blocked on the approval UI
    if (waitingForApiPermission) {
      return;
    }

    // Show a prompt if the user has not said one way or another whether they want to use the API
    if (getState().dimApi.apiPermissionGranted === null) {
      waitingForApiPermission = true;
      try {
        const useApi = await promptForApiPermission();
        dispatch(setApiPermissionGranted(useApi));
      } finally {
        waitingForApiPermission = false;
      }
    }

    // Load accounts info - we can't load the profile-specific DIM API data without it.
    const getPlatformsPromise = dispatch(getPlatforms()); // in parallel, we'll wait later

    // Load from indexedDB if needed
    await dispatch(loadProfileFromIndexedDB());
    installObservers(dispatch); // idempotent

    // They don't want to sync from the server, or the API is disabled - stick with local data
    if (
      !getState().dimApi.apiPermissionGranted ||
      !getState().dimApi.globalSettings.dimApiEnabled
    ) {
      readyResolve();
      return;
    }

    // don't load from remote if there is already an update queue from IDB - we'd roll back data otherwise!
    if (getState().dimApi.updateQueue.length > 0) {
      try {
        await dispatch(flushUpdates()); // flushUpdates will call loadDimApiData again at the end
        return;
      } catch (e) {}
    }

    // How long before the API data is considered stale is controlled from the server
    const profileOutOfDate =
      Date.now() - getState().dimApi.profileLastLoaded >
      getState().dimApi.globalSettings.dimProfileMinimumRefreshInterval * 1000;

    if (forceLoad || !getState().dimApi.profileLoaded || profileOutOfDate) {
      // get current account
      const accounts = await getPlatformsPromise;
      if (!accounts.length) {
        // User isn't logged in or has no accounts, nothing to load!
        return;
      }
      const currentAccount = currentAccountSelector(getState());

      try {
        const profileResponse = await getDimApiProfile(currentAccount);
        dispatch(profileLoaded({ profileResponse, account: currentAccount }));

        // Quickly heal from being failure backoff
        getProfileBackoff = Math.floor(getProfileBackoff / 2);
      } catch (e) {
        // Only notify error once
        if (!getState().dimApi.profileLoadedError) {
          showProfileLoadErrorNotification(e);
        }
        dispatch(profileLoadError(e));

        errorLog('loadDimApiData', 'Unable to get profile from DIM API', e);

        if (e.name !== 'FatalTokenError') {
          // Wait, with exponential backoff
          getProfileBackoff++;
          const waitTime = getBackoffWaitTime(getProfileBackoff);
          infoLog('loadDimApiData', 'Waiting', waitTime, 'ms before re-attempting profile fetch');

          // Wait, then retry. We don't await this here so we don't stop the finally block from running
          delay(waitTime).then(() => dispatch(loadDimApiData(forceLoad)));
        } else if ($DIM_FLAVOR === 'dev') {
          dispatch(needsDeveloper());
        }
        return;
      } finally {
        // Release the app to load with whatever language was saved or the
        // default. Better to have the wrong language (that fixes itself on
        // reload) than to block the app working if the DIM API is down.
        readyResolve();
      }
    }

    // Make sure any queued updates get sent to the server
    await dispatch(flushUpdates());
  };
}

// Backoff multiplier
let flushUpdatesBackoff = 0;

/**
 * Process the queue of updates by sending them to the server
 */
function flushUpdates(): ThunkResult {
  return async (dispatch, getState) => {
    let dimApiState = getState().dimApi;

    // Skip flushing state if the API is disabled
    if (!dimApiState.globalSettings.dimApiEnabled) {
      return;
    }

    if (dimApiState.updateInProgressWatermark === 0 && dimApiState.updateQueue.length > 0) {
      // Prepare the queue
      dispatch(prepareToFlushUpdates());
      dimApiState = getState().dimApi;

      if (dimApiState.updateInProgressWatermark === 0) {
        return;
      }

      infoLog(
        'flushUpdates',
        'Flushing queue of',
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
        infoLog('flushUpdates', 'got results', updates, results);

        // Quickly heal from being failure backoff
        flushUpdatesBackoff = Math.floor(flushUpdatesBackoff / 2);

        dispatch(finishedUpdates(results));

        if (dimApiState.updateQueue.length > 0) {
          // Flush more updates!
          dispatch(flushUpdates());
        } else if (!dimApiState.profileLoaded) {
          // Load API data in case we didn't do it before
          dispatch(loadDimApiData());
        }
      } catch (e) {
        if (flushUpdatesBackoff === 0) {
          showUpdateErrorNotification(e);
        }
        errorLog('flushUpdates', 'Unable to save updates to DIM API', e);

        // Wait, with exponential backoff
        flushUpdatesBackoff++;
        const waitTime = getBackoffWaitTime(flushUpdatesBackoff);
        // Don't wait for the retry, so we don't block profile loading
        (async () => {
          infoLog('flushUpdates', 'Waiting', waitTime, 'ms before re-attempting updates');
          await delay(waitTime);

          // Now mark the queue failed so it can be retried. Until
          // updateInProgressWatermark gets reset no other flushUpdates call will
          // do anything.
          dispatch(flushUpdatesFailed());

          // Try again
          dispatch(flushUpdates());
        })();

        throw e;
      }
    }
  };
}

function loadProfileFromIndexedDB(): ThunkResult {
  return async (dispatch, getState) => {
    if (getState().dimApi.profileLoadedFromIndexedDb) {
      return;
    }

    const profile = await get<ProfileIndexedDBState | undefined>('dim-api-profile');
    dispatch(profileLoadedFromIDB(profile));
  };
}

/** Produce a new object that's only the key/values of obj that are also keys in defaults and which have values different from defaults. */
function subtractObject<T>(obj: T | undefined, defaults: T): Partial<T> {
  const result: Partial<T> = {};
  if (obj) {
    for (const key in defaults) {
      if (obj[key] !== undefined && !deepEqual(obj[key], defaults[key])) {
        result[key] = obj[key];
      }
    }
  }
  return result;
}

/**
 * Wipe out all data in the DIM Sync cloud storage. Not recoverable!
 */
export function deleteAllApiData(): ThunkResult<DeleteAllResponse['deleted']> {
  return async (dispatch, getState) => {
    const result = await deleteAllData();

    // If they have the API enabled, also clear out everything locally. Otherwise we'll just clear out the remote data.
    if (apiPermissionGrantedSelector(getState())) {
      dispatch(allDataDeleted());
    }

    return result;
  };
}

function showProfileLoadErrorNotification(e: Error) {
  showNotification(
    dimErrorToaster(t('Storage.ProfileErrorTitle'), t('Storage.ProfileErrorBody'), e)
  );
}

function showUpdateErrorNotification(e: Error) {
  showNotification(dimErrorToaster(t('Storage.UpdateErrorTitle'), t('Storage.UpdateErrorBody'), e));
}
