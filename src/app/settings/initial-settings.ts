import { Settings as DimApiSettings, defaultSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

export interface Settings extends DimApiSettings {
  /** Selected columns for the Vault Organizer */
  readonly organizerColumnsGhost: string[];
  readonly loMinPower: number;
  readonly loMinStatTotal: number;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  customTotalStatsByClass: {},
  loMinPower: 750,
  loMinStatTotal: 55,
  organizerColumnsGhost: ['icon', 'name', 'locked', 'tag', 'ghost', 'perks', 'notes'],
};
