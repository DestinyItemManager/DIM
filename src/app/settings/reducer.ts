import { Reducer } from 'redux';
import { Settings } from './settings';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { RootState } from '../store/reducers';

export const characterOrderSelector = (state: RootState) =>
  (state.settings.settings as Settings).characterOrder;

export interface SettingsState {
  readonly settings: Settings | {};
}

export const initialSettingsState: SettingsState = {
  settings: {}
};

export type SettingsAction = ActionType<typeof actions>;

// TODO: Figure out how to drive saving settings from this state
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
