import { Reducer } from 'redux';
import { Settings } from './settings';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { RootState } from '../store/reducers';

export const settingsSelector = (state: RootState) => state.settings.settings as Settings;

export const characterOrderSelector = (state: RootState) => settingsSelector(state).characterOrder;

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
  const settings = state.settings as Settings;

  switch (action.type) {
    case getType(actions.loaded):
      return {
        ...state,
        settings: action.payload
      };

    case getType(actions.toggleCollapsedSection):
      settings.collapsedSections = {
        ...settings.collapsedSections,
        [action.payload.sectionId]: !settings.collapsedSections[action.payload.sectionId]
      };

      // Ugh
      settings.save();

      return {
        ...state,
        settings
      };
    default:
      return state;
  }
};
