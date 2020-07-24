import { Settings as DimApiSettings, defaultSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

export interface Settings extends DimApiSettings {
  /** Selected columns for the Vault Organizer */
  readonly organizerColumnsGhost: string[];
  readonly loMinPower: number;
  readonly loMinStatTotal: number;
  /**
   * if true, a character's "Max Power" is shown using the no-two-exotics rule
   * if false, it uses the highest items in all slots (how the game determines drop levels)
   */
  readonly showPowerMaxAsEquippable: boolean;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  customTotalStatsByClass: {},
  showPowerMaxAsEquippable: false,
  loMinPower: 750,
  loMinStatTotal: 55,
  organizerColumnsGhost: ['icon', 'name', 'locked', 'tag', 'ghost', 'perks', 'notes'],
};
