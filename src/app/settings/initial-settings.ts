import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage, DimLanguage } from 'app/i18n';

/**
 * We extend the settings interface so we can try out new settings before committing them to dim-api-types
 */
export interface Settings extends DimApiSettings {
  language: DimLanguage;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  itemFeedWatermark: '0',
};
