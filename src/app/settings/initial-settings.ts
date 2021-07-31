import {
  defaultSettings,
  Settings as DimApiSettings,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

export interface Settings extends DimApiSettings {
  activeMode: boolean;
  loLockItemEnergyType: boolean;
  /** Badge the app icon with the number of postmaster items on the current character */
  badgePostmaster: boolean;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  organizerColumnsGhost: ['icon', 'name', 'locked', 'tag', 'perks', 'notes'],
  compareBaseStats: false,
  sidecarCollapsed: false,
  activeMode: false,
  loUpgradeSpendTier: UpgradeSpendTier.Nothing,
  loLockItemEnergyType: false,
  singleCharacter: false,
  badgePostmaster: true,
};
