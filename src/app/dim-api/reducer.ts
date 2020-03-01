import { Reducer } from 'redux';
import * as actions from './basic-actions';
import { ActionType, getType } from 'typesafe-actions';
import _ from 'lodash';
import { ProfileUpdateWithRollback } from './api-types';
import { initialState as initialSettingsState, Settings } from '../settings/reducer';
import {
  ProfileResponse,
  GlobalSettings,
  defaultGlobalSettings
} from '@destinyitemmanager/dim-api-types';
import { settings } from 'cluster';

export interface DimApiState {
  globalSettings: GlobalSettings;
  globalSettingsLoaded: boolean;

  /** Has the user granted us permission to store their info? */
  apiPermissionGranted: boolean;

  // TODO: encapsulate async loading state
  profileLoadedFromIndexedDb: boolean;
  profileLoaded: boolean;
  profileLoadedError?: Error;

  // Settings are global, not per-platform-membership
  settings: Settings;

  // Store profile data per account. The key is `${platformMembershipId}-d${destinyVersion}`.
  profiles: {
    [accountKey: string]: {
      loadouts: ProfileResponse['loadouts'];
      tags: ProfileResponse['tags'];
    };
  };

  // Updates that haven't yet been flushed to the API. Each one is optimistic - we apply its
  // effects to local state immediately, but if they fail later we undo their effects. This
  // is stored locally to be redriven.
  updateQueue: ProfileUpdateWithRollback[];
}

/**
 * Global DIM platform settings from the DIM API.
 */
const initialState: DimApiState = {
  globalSettingsLoaded: false,
  globalSettings: {
    ...defaultGlobalSettings,
    // 2019-12-17 we've been asked to disable auto-refresh
    autoRefresh: false
  },

  apiPermissionGranted: localStorage.getItem('dim-api-enabled') === 'true',

  // TODO: don't allow mutations if DIM API is disabled, profile isn't loaded, or API usage isn't agreed to
  profileLoaded: false,
  profileLoadedFromIndexedDb: false,

  // TODO: move to
  settings: initialSettingsState,

  profiles: {},

  updateQueue: []
};

type DimApiAction = ActionType<typeof actions>;

export const dimApi: Reducer<DimApiState, DimApiAction> = (
  state: DimApiState = initialState,
  action: DimApiAction
) => {
  switch (action.type) {
    case getType(actions.globalSettingsLoaded):
      return {
        ...state,
        globalSettingsLoaded: true,
        globalSettings: {
          ...state.globalSettings,
          ...action.payload
        }
      };

    case getType(actions.profileLoadedFromIDB):
      // When loading from IDB, merge with current state
      return action.payload
        ? {
            ...state,
            profileLoadedFromIndexedDb: true,
            settings: {
              ...state.settings,
              ...action.payload.settings
            },
            profiles: {
              ...state.profiles,
              ...action.payload.profiles
            },
            updateQueue: [...action.payload.updateQueue, ...state.updateQueue]
          }
        : {
            ...state,
            profileLoadedFromIndexedDb: true
          };

    case getType(actions.profileLoaded): {
      const { profileResponse, account } = action.payload;
      return {
        ...state,
        profileLoaded: true,
        settings: {
          ...state.settings,
          ...profileResponse.settings
        },
        profiles: account
          ? {
              ...state.profiles,
              // Overwrite just this account's profile
              // TODO: if there's an update queue, replay it on top!
              [`${account.membershipId}-d${account.destinyVersion}`]: {
                loadouts: profileResponse.loadouts,
                tags: profileResponse.tags
              }
            }
          : state.profiles
      };
    }

    default:
      return state;
  }
};
