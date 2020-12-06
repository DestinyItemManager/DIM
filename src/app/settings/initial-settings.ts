import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

export interface Settings extends DimApiSettings {
  /** Selected columns for the Vault Organizer */
  readonly organizerColumnsGhost: string[];
  compareBaseStats: boolean;
  /** Item popup sidecar collapsed just shows icon and no character locations */
  sidecarCollapsed: boolean;
  activeMode: boolean;

  /** In "Single Character Mode" DIM pretends you only have one (active) character and all the other characters' items are in the vault. */
  singleCharacter: boolean;

  /** Show confetti for hitting milestone */
  disableConfetti: boolean;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  organizerColumnsGhost: ['icon', 'name', 'locked', 'tag', 'perks', 'notes'],
  compareBaseStats: false,
  sidecarCollapsed: false,
  activeMode: false,
  singleCharacter: false,
  disableConfetti: false,
};
