import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage, DimLanguage } from 'app/i18n';

export const enum ItemPopupTab {
  Overview,
  Triage,
}

export const enum VaultWeaponGroupingStyle {
  Lines,
  Inline,
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
  vaultWeaponGroupingStyle: VaultWeaponGroupingStyle;
  itemPopupTab: ItemPopupTab;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  theme: 'default',
  sortRecordProgression: false,
  vendorsHideSilverItems: false,
  vaultWeaponGrouping: '',
  vaultWeaponGroupingStyle: VaultWeaponGroupingStyle.Lines,
  itemPopupTab: ItemPopupTab.Overview,
  organizerColumnsWeapons: [
    'icon',
    'name',
    'dmg',
    'power',
    'tag',
    'wishList',
    'archetype',
    'perks',
    'traits',
    'originTrait',
    'notes',
  ],
  organizerColumnsArmor: [
    'icon',
    'name',
    'power',
    'energy',
    'tag',
    'modslot',
    'intrinsics',
    'perks',
    'baseStats',
    'customstat',
    'notes',
  ],
  organizerColumnsGhost: ['icon', 'name', 'tag', 'perks', 'notes'],
};
