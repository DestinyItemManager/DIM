import { DeleteAllResponse } from '@destinyitemmanager/dim-api-types';
import { needsDeveloper } from 'app/accounts/actions';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { accountsSelector, currentAccountSelector } from 'app/accounts/selectors';
import { FatalTokenError } from 'app/bungie-api/authenticated-fetch';
import { dimErrorToaster } from 'app/bungie-api/error-toaster';
import { getToken } from 'app/bungie-api/oauth-tokens';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { Settings, initialSettingsState } from 'app/settings/initial-settings';
import { readyResolve } from 'app/settings/settings';
import { refresh$ } from 'app/shell/refresh-events';
import { get, set } from 'app/storage/idb-keyval';
import { observe } from 'app/store/observerMiddleware';
import { RootState, ThunkResult } from 'app/store/types';
import { convertToError, errorMessage } from 'app/utils/errors';
import { errorLog, infoLog } from 'app/utils/log';
import { delay } from 'app/utils/promises';
import { debounce, once } from 'es-toolkit';
import { deepEqual } from 'fast-equals';
import { AnyAction, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { getPlatforms } from '../accounts/platforms';
import {
  deleteAllData,
  getDimApiProfile,
  getGlobalSettings,
  postUpdates,
} from '../dim-api/dim-api';
import { promptForApiPermission } from './api-permission-prompt';
import { ProfileUpdateWithRollback } from './api-types';
import {
  ProfileIndexedDBState,
  allDataDeleted,
  finishedUpdates,
  flushUpdatesFailed,
  globalSettingsLoaded,
  prepareToFlushUpdates,
  profileLoadError,
  profileLoaded,
  profileLoadedFromIDB,
  setApiPermissionGranted,
} from './basic-actions';
import { DimApiState } from './reducer';
import { apiPermissionGrantedSelector, makeProfileKeyFromAccount } from './selectors';

const TAG = 'dim sync';

const installApiPermissionObserver = once(<D extends Dispatch>(dispatch: D) => {
  // Observe API permission and reflect it into local storage
  // We could also use a thunk action instead of an observer... either way
  dispatch(
    observe({
      id: 'api-permission-observer',
      runInitially: true,
      getObserved: (state) => state.dimApi.apiPermissionGranted,
      sideEffect: ({ current }) => {
        if (current !== null) {
          // Save the permission preference to local storage
          localStorage.setItem('dim-api-enabled', current ? 'true' : 'false');
        }
      },
    }),
  );
});

/**
 * Watch the redux store and write out values to indexedDB, etc.
 */
const installObservers = once((dispatch: ThunkDispatch<RootState, undefined, AnyAction>) => {
  // Watch the state and write it out to IndexedDB
  dispatch(
    observe({
      id: 'profile-observer',
      getObserved: (state) => state.dimApi,
      sideEffect: debounce(
        ({ previous, current }: { previous: DimApiState | undefined; current: DimApiState }) => {
          if (
            // Avoid writing back what we just loaded from IDB
            previous?.profileLoadedFromIndexedDb &&
            // Check to make sure one of the fields we care about has changed
            (current.settings !== previous.settings ||
              current.profiles !== previous.profiles ||
              current.updateQueue !== previous.updateQueue ||
              current.itemHashTags !== previous.itemHashTags ||
              current.searches !== previous.searches ||
              current.globalSettings !== previous.globalSettings)
          ) {
            // Only save the difference between the current and default settings
            const settingsToSave = subtractObject(
              current.settings,
              initialSettingsState,
            ) as Settings;

            const savedState: ProfileIndexedDBState = {
              settings: settingsToSave,
              profiles: current.profiles,
              updateQueue: current.updateQueue,
              itemHashTags: current.itemHashTags,
              searches: current.searches,
              globalSettings: current.globalSettings,
            };
            infoLog(TAG, 'Saving profile data to IDB');
            set('dim-api-profile', savedState);
          }
        },
        1000,
      ),
    }),
  );

  // Watch the update queue and flush updates
  dispatch(
    observe({
      id: 'queue-observer',
      getObserved: (state) => state.dimApi.updateQueue,
      sideEffect: debounce(({ current }: { current: ProfileUpdateWithRollback[] }) => {
        if (current.length) {
          dispatch(flushUpdates());
        }
      }, 1000),
    }),
  );

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
        infoLog(TAG, 'globalSettings', globalSettings);
        dispatch(globalSettingsLoaded(globalSettings));
      } catch (e) {
        errorLog(TAG, 'Failed to load global settings from DIM API', e);
      }
    }
  };
}

/**
 * Wait, with exponential backoff - we'll try infinitely otherwise, in a tight loop!
 * Double the wait time, starting with 60 seconds, until we reach 10 minutes.
 */
function getBackoffWaitTime(backoff: number) {
  // Don't wait less than 10 seconds or more than 10 minutes
  return Math.max(10_000, Math.min(10 * 60 * 1000, Math.random() * Math.pow(2, backoff) * 30_000));
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
export function loadDimApiData(
  options: {
    /**
     * forceLoad will load from the server even if the minimum refresh
     * interval has not passed. Keep in mind the server caches full-profile data for
     * up to 60 seconds. This will also skip using a sync token to load incremental changes.
     */
    forceLoad?: boolean;
  } = {},
): ThunkResult {
  return async (dispatch, getState) => {
    const { forceLoad = false } = options;
    installApiPermissionObserver(dispatch);

    // Load from indexedDB if needed
    const profileFromIDB = dispatch(loadProfileFromIndexedDB());

    // Load global settings first. This fails open (we fall back to defaults)
    // but loading it first gives us a chance to find out if the API is disabled
    // and what the current refresh rate is, which gives us important
    // operational controls in case the API is knocked over.
    const globalSettingsLoad = dispatch(loadGlobalSettings());

    // Don't let actions pile up blocked on the approval UI
    if (waitingForApiPermission) {
      return;
    }

    // Show a prompt if the user has not said one way or another whether they want to use the API
    const hasBungieToken = Boolean(getToken());
    if (getState().dimApi.apiPermissionGranted === null && hasBungieToken) {
      waitingForApiPermission = true;
      try {
        const useApi = await promptForApiPermission();
        dispatch(setApiPermissionGranted(useApi));
      } finally {
        waitingForApiPermission = false;
      }
    }

    // Load accounts info - we can't load the profile-specific DIM API data without it.
    const getPlatformsPromise = dispatch(getPlatforms); // in parallel, we'll wait later

    await profileFromIDB;
    readyResolve();
    installObservers(dispatch); // idempotent

    await Promise.race([globalSettingsLoad, delay(3_000)]); // don't wait forever for global settings

    // They don't want to sync from the server, or the API is disabled - stick with local data
    if (
      !getState().dimApi.apiPermissionGranted ||
      !getState().dimApi.globalSettings.dimApiEnabled
    ) {
      return;
    }

    // don't load from remote if there is already an update queue from IDB - we'd roll back data otherwise!
    if (getState().dimApi.updateQueue.length > 0) {
      try {
        await dispatch(flushUpdates()); // flushUpdates will call loadDimApiData again at the end
        return;
      } catch {}
    }

    // get current account
    await getPlatformsPromise;
    if (!accountsSelector(getState()).length) {
      // User isn't logged in or has no accounts, nothing to load!
      return;
    }
    const currentAccount = currentAccountSelector(getState());

    // How long before the API data is considered stale is controlled from the server
    const profileOutOfDateOrMissing =
      profileLastLoaded(getState().dimApi, currentAccount) >
      getState().dimApi.globalSettings.dimProfileMinimumRefreshInterval * 1000;

    if (forceLoad || profileOutOfDateOrMissing) {
      try {
        const syncToken =
          currentAccount && $featureFlags.dimApiSync && !forceLoad
            ? getState().dimApi.profiles?.[makeProfileKeyFromAccount(currentAccount)]?.sync
            : undefined;
        const profileResponse = await getDimApiProfile(currentAccount, syncToken);
        dispatch(profileLoaded({ profileResponse, account: currentAccount }));
        infoLog(TAG, 'Loaded profile from DIM API', profileResponse);

        // Quickly heal from being failure backoff
        getProfileBackoff = Math.floor(getProfileBackoff / 2);
      } catch (err) {
        if (err instanceof FatalTokenError) {
          // We're already sent to login, don't keep trying to use DIM Sync.
          if ($DIM_FLAVOR === 'dev') {
            dispatch(needsDeveloper());
          }
          return;
        }

        // Only notify error once
        if (!getState().dimApi.profileLoadedError) {
          showProfileLoadErrorNotification(err);
        }

        const e = convertToError(err);

        dispatch(profileLoadError(e));

        errorLog(TAG, 'Unable to get profile from DIM API', e);

        // Wait, with exponential backoff
        getProfileBackoff++;
        const waitTime = getBackoffWaitTime(getProfileBackoff);
        infoLog(TAG, 'Waiting', waitTime, 'ms before re-attempting profile fetch');

        // Wait, then retry. We don't await this here so we don't stop the finally block from running
        delay(waitTime).then(() => dispatch(loadDimApiData(options)));
      }
    }

    // Make sure any queued updates get sent to the server
    await dispatch(flushUpdates());
  };
}

/**
 * Get either the profile-specific last loaded time, or the global one if we don't have
 * an account selected.
 */
function profileLastLoaded(dimApi: DimApiState, account: DestinyAccount | undefined) {
  return (
    Date.now() -
    (account
      ? (dimApi.profiles[makeProfileKeyFromAccount(account)]?.profileLastLoaded ?? 0)
      : dimApi.profileLastLoaded)
  );
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

    // Skip if there's already an update going on, or the queue is empty
    if (dimApiState.updateInProgressWatermark !== 0 || dimApiState.updateQueue.length === 0) {
      return;
    }

    // Prepare the queue
    dispatch(prepareToFlushUpdates());
    dimApiState = getState().dimApi;

    if (dimApiState.updateInProgressWatermark === 0) {
      return;
    }

    infoLog(TAG, 'Flushing queue of', dimApiState.updateInProgressWatermark, 'updates');

    // Only select the items that were frozen for update. They're guaranteed
    // to not change while we're updating and they'll be for a single profile.
    const updates = dimApiState.updateQueue.slice(0, dimApiState.updateInProgressWatermark);

    try {
      const firstWithAccount = updates.find((u) => u.platformMembershipId) || updates[0];

      const results = await postUpdates(
        firstWithAccount.platformMembershipId,
        firstWithAccount.destinyVersion,
        updates,
      );

      // Quickly heal from being failure backoff
      flushUpdatesBackoff = Math.floor(flushUpdatesBackoff / 2);

      dispatch(finishedUpdates(results));

      dimApiState = getState().dimApi;
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
      errorLog(TAG, 'Unable to save updates to DIM API', e);

      // Wait, with exponential backoff
      flushUpdatesBackoff++;
      const waitTime = getBackoffWaitTime(flushUpdatesBackoff);
      // Don't wait for the retry, so we don't block profile loading
      (async () => {
        infoLog(TAG, 'Waiting', waitTime, 'ms before re-attempting updates');
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

function showProfileLoadErrorNotification(e: unknown) {
  showNotification(
    dimErrorToaster(t('Storage.ProfileErrorTitle'), t('Storage.ProfileErrorBody'), errorMessage(e)),
  );
}

function showUpdateErrorNotification(e: unknown) {
  showNotification(
    dimErrorToaster(t('Storage.UpdateErrorTitle'), t('Storage.UpdateErrorBody'), errorMessage(e)),
  );
}
