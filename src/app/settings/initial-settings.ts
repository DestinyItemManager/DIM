import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

/**
 * We extend the settings interface so we can try out new settings before committing them to dim-api-types
 */
export interface Settings extends DimApiSettings {
  activeMode: boolean;
  /** How many spaces to clear when using Farming Mode(make space). */
  inventoryClearSpaces: number;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  activeMode: false,
  inventoryClearSpaces: 1,
};
