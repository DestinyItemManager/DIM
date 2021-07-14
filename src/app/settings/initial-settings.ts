import {
  defaultSettings,
  Settings as DimApiSettings,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

// Todo(ryan): Temporary until api types are available
export enum UpgradeSpendTier {
  Nothing,
  LegendaryShards,
  EnhancementPrisms,
  AscendantShardsNotExotic,
  AscendantShards,
  AscendantShardsNotMasterworked,
}

export interface Settings extends DimApiSettings {
  activeMode: boolean;
  loUpgradeSpendTier: UpgradeSpendTier;
  loLockItemEnergyType: boolean;
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
};
