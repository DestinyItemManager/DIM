import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import _ from 'lodash';
import { GlobalSettings } from 'app/dim-api/global-settings';

export interface DimApiState {
  settings: GlobalSettings;
  settingsLoaded: boolean;
}

/**
 * Global DIM platform settings from the DIM API.
 */
const initialState: DimApiState = {
  settingsLoaded: false,
  settings: {
    dimApiEnabled: true,
    destinyProfileMinimumRefreshInterval: 30,
    destinyProfileRefreshInterval: 30,
    // 2019-12-17 we've been asked to disable auto-refresh
    autoRefresh: false,
    refreshProfileOnVisible: true,
    bustProfileCacheOnHardRefresh: false
  }
};

type DimApiAction = ActionType<typeof actions>;

export const dimApi: Reducer<DimApiState, DimApiAction> = (
  state: DimApiState = initialState,
  action: DimApiAction
) => {
  switch (action.type) {
    case getType(actions.settingsLoaded):
      return {
        ...state,
        settingsLoaded: true,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    default:
      return state;
  }
};
