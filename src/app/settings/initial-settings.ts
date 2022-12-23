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

  /**
   * Cutoff point; the instance ID of the newest item that isn't shown in
   * the item feed anymore after the user presses the "clear" button.
   */
  readonly itemFeedWatermark: string | undefined;

  /** Automatically sync lock status with tag */
  readonly autoLockTagged: boolean;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  itemSortReversals: [],
  descriptionsToDisplay: 'both',
  compareWeaponMasterwork: false,
  itemFeedWatermark: undefined,
  autoLockTagged: false,
};
