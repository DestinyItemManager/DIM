import { Settings as DimApiSettings, defaultSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';
import { KeyedStatHashLists } from 'app/dim-ui/CustomStatTotal';

export interface Settings extends DimApiSettings {
  /** list of stat hashes of interest, keyed by class enum */
  readonly customTotalStatsByClass: KeyedStatHashLists;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  customTotalStatsByClass: {}
};
