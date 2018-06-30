import { combineReducers } from 'redux';
import { Settings } from './settings';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';

export interface SettingsState {
  readonly settings: Readonly<Settings>;
}

export const initialSettingsState: SettingsState = {
  settings: new Settings()
};

export type SettingsAction = ActionType<typeof actions>;

export const settings = combineReducers<SettingsState>({
  settings: (
    state: SettingsState['settings'] = initialSettingsState,
    action: SettingsAction
  ) => {
    switch (action.type) {
      case getType(actions.save):
        return state;
      default:
        return state;
    }
  }
});
