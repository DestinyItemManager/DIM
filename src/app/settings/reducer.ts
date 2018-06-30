import { combineReducers } from 'redux';
import { Settings } from './settings';
import { SettingsActions, SettingsAction } from './actions';

export interface SettingsState {
  readonly settings: Readonly<Settings>;
}

export const initialSettingsState: SettingsState = {
  settings: new Settings()
};

export const settings = combineReducers<SettingsState>({
  settings: (
    state: SettingsState['settings'] = initialSettingsState,
    action: SettingsAction
  ) => {
    switch (action.type) {
      case SettingsActions.SAVE:
        return state;
      default:
        return state;
    }
  }
});
