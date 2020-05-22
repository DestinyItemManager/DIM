import { createAction } from 'typesafe-actions';
import { DimApiState } from './reducer';
import {
  GlobalSettings,
  ProfileResponse,
  ProfileUpdateResult,
} from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';

/**
 * These are all the "basic" actions for the API - stuff that gets reacted to in the reducer.
 *
 * Thunk actions that coordinate more complext workflows are in ./actions.
 */

/** Bulk update global settings after they've been loaded. */
export const globalSettingsLoaded = createAction('dim-api/GLOBAL_SETTINGS_LOADED')<
  Partial<GlobalSettings>
>();

export const profileLoaded = createAction('dim-api/PROFILE_LOADED')<{
  profileResponse: ProfileResponse;
  account?: DestinyAccount;
}>();

export const profileLoadError = createAction('dim-api/PROFILE_ERROR')<Error>();

export type ProfileIndexedDBState = Pick<DimApiState, 'settings' | 'profiles' | 'updateQueue'>;
export const profileLoadedFromIDB = createAction('dim-api/LOADED_PROFILE_FROM_IDB')<
  ProfileIndexedDBState | undefined
>();

/**
 * This signals that we are about to flush the update queue.
 */
export const prepareToFlushUpdates = createAction('dim-api/PREPARE_UPDATES')();

export const flushUpdatesFailed = createAction('dim-api/UPDATES_FAILED')();

export const finishedUpdates = createAction('dim-api/FINISHED_UPDATES')<ProfileUpdateResult[]>();

export const setApiPermissionGranted = createAction('dim-api/SET_API_PERMISSION')<boolean>();

export const allDataDeleted = createAction('dim-api/ALL_DATA_DELETED')();
