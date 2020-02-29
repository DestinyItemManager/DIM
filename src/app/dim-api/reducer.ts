import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import _ from 'lodash';
import { ProfileResponse, GlobalSettings } from './api-types';
import { initialState as initialSettingsState } from '../settings/reducer';

export interface DimApiState {
  globalSettings: GlobalSettings;
  globalSettingsLoaded: boolean;

  // TODO: encapsulate async loading state
  profileLoadedFromIndexedDb: boolean;
  profileLoaded: boolean;
  profileLoadedError?: Error;

  profile: ProfileResponse;
}

/**
 * Global DIM platform settings from the DIM API.
 */
const initialState: DimApiState = {
  globalSettingsLoaded: false,
  globalSettings: {
    dimApiEnabled: true,
    destinyProfileMinimumRefreshInterval: 30,
    destinyProfileRefreshInterval: 30,
    // 2019-12-17 we've been asked to disable auto-refresh
    autoRefresh: false,
    refreshProfileOnVisible: true,
    bustProfileCacheOnHardRefresh: false
  },

  profileLoaded: false,
  profileLoadedFromIndexedDb: false,
  profile: {
    settings: initialSettingsState
  }
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

    default:
      return state;
  }
};
