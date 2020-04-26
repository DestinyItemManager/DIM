import { Settings as DimApiSettings, defaultSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';
import { KeyedStatHashLists } from 'app/dim-ui/CustomStatTotal';

export interface Settings extends DimApiSettings {
  /** list of stat hashes of interest, keyed by class enum */
  readonly customTotalStatsByClass: KeyedStatHashLists;

  /** Selected columns for the Vault Organizer */
  readonly organizerColumns: string[];
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  customTotalStatsByClass: {},
  organizerColumns: [
    'icon',
    'name',
    'dmg',
    'power',
    'locked',
    'tag',
    'wishList',
    'rating',
    'archetype',
    'perks',
    'mods',
    'notes'
  ]
};
