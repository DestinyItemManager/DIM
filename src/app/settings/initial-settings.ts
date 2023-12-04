import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage, DimLanguage } from 'app/i18n';

export const enum ItemPopupTab {
  Overview,
  Triage,
}

/**
 * We extend the settings interface so we can try out new settings before committing them to dim-api-types
 */
export interface Settings extends DimApiSettings {
  language: DimLanguage;
  theme: string;
  sortRecordProgression: boolean;
  vendorsHideSilverItems: boolean;
  vaultWeaponGrouping: string;
  itemPopupTab: ItemPopupTab;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  theme: 'default',
  sortRecordProgression: false,
  vendorsHideSilverItems: false,
  vaultWeaponGrouping: '',
  itemPopupTab: ItemPopupTab.Overview,
};
