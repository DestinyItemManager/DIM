import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

export interface Settings extends DimApiSettings {
  /** Selected columns for the Vault Organizer */
  readonly organizerColumnsGhost: string[];
  /** Whether to ignore element affinity on armor in the loadout optimizer. */
  readonly loIgnoreAffinity: boolean;
  /** The maximum affinity level to ignore on armor in the loadout optimizer. */
  readonly loMaxEnergy: number;
  compareBaseStats: boolean;
  /** Item popup sidecar collapsed just shows icon and no character locations */
  sidecarCollapsed: boolean;
  activeMode: boolean;

  /** In "Single Character Mode" DIM pretends you only have one (active) character and all the other characters' items are in the vault. */
  singleCharacter: boolean;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  loIgnoreAffinity: false,
  loMaxEnergy: 8,
  organizerColumnsGhost: ['icon', 'name', 'locked', 'tag', 'perks', 'notes'],
  compareBaseStats: false,
  sidecarCollapsed: false,
  activeMode: false,
  singleCharacter: false,
};
