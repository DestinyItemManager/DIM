import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

/**
 * We extend the settings interface so we can try out new settings before committing them to dim-api-types
 */
export type Settings = DimApiSettings;

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
};
