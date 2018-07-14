import { Reducer } from 'redux';
import { Settings } from './settings';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';

export interface SettingsState {
  readonly settings: Settings | {};
}

export const initialSettingsState: SettingsState = {
  settings: {}
};

export type SettingsAction = ActionType<typeof actions>;

export const settings: Reducer<SettingsState, SettingsAction> = (
  state: SettingsState = initialSettingsState,
  action: SettingsAction
) => {
  switch (action.type) {
    case getType(actions.loaded):
      return {
        settings: action.payload
      };
    case getType(actions.set):
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.property]: action.payload.value
        }
      };
    default:
      return state;
  }
};
