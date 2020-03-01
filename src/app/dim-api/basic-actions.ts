import { createAction } from 'typesafe-actions';
import { DimApiState } from './reducer';
import { GlobalSettings, ProfileResponse } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import _ from 'lodash';

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

export type ProfileIndexedDBState = Pick<DimApiState, 'settings' | 'profiles' | 'updateQueue'>;
export const profileLoadedFromIDB = createAction('dim-api/LOADED_PROFILE_FROM_IDB')<
  ProfileIndexedDBState | undefined
>();
