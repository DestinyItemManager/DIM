import { Settings } from "./settings";

export enum SettingsActions {
  SAVE = 'SAVE',
  OTHER = '__any_other_action_type__'
}

export interface SaveSettingsAction {
  type: SettingsActions.SAVE;
  settings: Settings;
}

export function saveSettings(settings: Settings): SaveSettingsAction {
  return {
    type: SettingsActions.SAVE,
    settings
  };
}

export type SettingsAction =
  | SaveSettingsAction;
