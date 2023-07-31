import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage, DimLanguage } from 'app/i18n';

/**
 * We extend the settings interface so we can try out new settings before committing them to dim-api-types
 */
export interface Settings extends DimApiSettings {
  language: DimLanguage;
  loIncludeVendorItems: boolean;
  theme: string;
  sortRecordProgression: boolean;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  loIncludeVendorItems: false,
  language: defaultLanguage(),
  theme: 'default',
  sortRecordProgression: false,
};
