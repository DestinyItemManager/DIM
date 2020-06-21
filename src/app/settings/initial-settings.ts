import { Settings as DimApiSettings, defaultSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

export interface Settings extends DimApiSettings {
  /** Selected columns for the Vault Organizer */
  readonly organizerColumnsWeapons: string[];
  readonly organizerColumnsArmor: string[];

  readonly loMinPower: number;
  readonly loMinStatTotal: number;
  readonly organizerColumnsGhost: string[];
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  customTotalStatsByClass: {},
  organizerColumnsWeapons: [
    'icon',
    'name',
    'dmg',
    'power',
    'locked',
    'tag',
    'wishList',
    'archetype',
    'perks',
    'notes',
  ],
  organizerColumnsArmor: [
    'icon',
    'name',
    'power',
    'dmg',
    'energy',
    'locked',
    'tag',
    'ghost',
    'modslot',
    'perks',
    'stats',
    'customstat',
    'notes',
  ],
  loMinPower: 750,
  loMinStatTotal: 55,
  organizerColumnsGhost: ['icon', 'name', 'locked', 'tag', 'ghost', 'perks', 'notes'],
};
