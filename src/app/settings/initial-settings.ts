import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

export interface Settings extends DimApiSettings {
  /** Selected columns for the Vault Organizer */
  readonly organizerColumnsGhost: string[];
  readonly loMinPower: number;
  readonly loMinStatTotal: number;
  /** Whether to ignore element affinity on armor in the loadout optimizer. */
  readonly loIgnoreAffinity: boolean;
  /** The maximum affinity level to ignore on armor in the loadout optimizer. */
  readonly loMaxEnergy: number;
  compareBaseStats: boolean;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  customTotalStatsByClass: {},
  loMinPower: 750,
  loMinStatTotal: 55,
  loIgnoreAffinity: false,
  loMaxEnergy: 8,
  organizerColumnsGhost: ['icon', 'name', 'locked', 'tag', 'ghost', 'perks', 'notes'],
  compareBaseStats: false,
};
