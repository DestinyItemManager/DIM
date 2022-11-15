import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

/**
 * We extend the settings interface so we can try out new settings before committing them to dim-api-types
 */
export interface Settings extends DimApiSettings {
  /** supplements itemSortOrderCustom by allowing each sort to be reversed */
  itemSortReversals: string[];

  /** Select descriptions to display */
  readonly descriptionsToDisplay: 'bungie' | 'community' | 'both';

  /** Plug the T10 masterwork into D2Y2+ random roll weapons for comparison purposes. */
  readonly compareWeaponMasterwork: boolean;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  itemSortReversals: [],
  descriptionsToDisplay: 'both',
  compareWeaponMasterwork: false,
};
