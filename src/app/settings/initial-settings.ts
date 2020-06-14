import { Settings as DimApiSettings, defaultSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';
import { KeyedStatHashLists } from 'app/dim-ui/CustomStatTotal';

export interface Settings extends DimApiSettings {
  /** list of stat hashes of interest, keyed by class enum */
  readonly customTotalStatsByClass: KeyedStatHashLists;

  /** Selected columns for the Vault Organizer */
  readonly organizerColumnsWeapons: string[];
  readonly organizerColumnsArmor: string[];
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
  loStatSortOrder: [
    '2996146975', //Mobility
    '392767087', //Resilience
    '1943323491', //Recovery
    '1735777505', //Discipline
    '144602215', //Intellect
    '4244567218', //Strength
  ],
  loAssumeMasterwork: false,
};
