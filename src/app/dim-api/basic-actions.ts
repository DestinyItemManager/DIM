import {
  GlobalSettings,
  ProfileResponse,
  ProfileUpdateResult,
  SearchType,
} from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { createAction } from 'typesafe-actions';
import type { DimApiState } from './reducer';

/**
 * These are all the "basic" actions for the API - stuff that gets reacted to in the reducer.
 *
 * Thunk actions that coordinate more complex workflows are in ./actions.
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

export type ProfileIndexedDBState = Pick<
  DimApiState,
  'settings' | 'profiles' | 'itemHashTags' | 'searches' | 'updateQueue' | 'globalSettings'
>;
export const profileLoadedFromIDB = createAction('dim-api/LOADED_PROFILE_FROM_IDB')<
  ProfileIndexedDBState | undefined
>();

/** Track or untrack a Triumph */
export const trackTriumph = createAction('dim-api/TRACK_TRIUMPH')<{
  recordHash: number;
  tracked: boolean;
}>();

/** Record that a search was used */
export const searchUsed = createAction('dim-api/SEARCH_USED')<{
  query: string;
  type: SearchType;
}>();

/** Save or un-save a search */
export const saveSearch = createAction('dim-api/SAVE_SEARCH')<{
  query: string;
  saved: boolean;
  type: SearchType;
}>();

/** Delete a saved search */
export const searchDeleted = createAction('dim-api/DELETE_SEARCH')<{
  query: string;
  type: SearchType;
}>();

/**
 * This signals that we are about to flush the update queue.
 */
export const prepareToFlushUpdates = createAction('dim-api/PREPARE_UPDATES')();

export const flushUpdatesFailed = createAction('dim-api/UPDATES_FAILED')();

export const finishedUpdates = createAction('dim-api/FINISHED_UPDATES')<ProfileUpdateResult[]>();

export const setApiPermissionGranted = createAction('dim-api/SET_API_PERMISSION')<boolean>();

export const allDataDeleted = createAction('dim-api/ALL_DATA_DELETED')();
