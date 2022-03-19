import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage } from 'app/i18n';

export const enum LoadoutSort {
  ByEditTime,
  ByName,
}

/**
 * We extend the settings interface so we can try out new settings before committing them to dim-api-types
 */
export interface Settings extends DimApiSettings {
  /** How many spaces to clear when using Farming Mode(make space). */
  inventoryClearSpaces: number;
  /** Display perks as a list instead of a grid. */
  perkList: boolean;
  loadoutSort: LoadoutSort;
  itemFeedHideTagged: boolean;
  itemFeedExpanded: boolean;
  /** Pull from postmaster is an irreversible action and some people don't want to accidentally hit it. */
  hidePullFromPostmaster: boolean;
  /** supplements itemSortOrderCustom by allowing each sort to be reversed */
  itemSortReversals: string[];
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  inventoryClearSpaces: 1,
  perkList: true,
  loadoutSort: LoadoutSort.ByEditTime,
  itemFeedHideTagged: true,
  itemFeedExpanded: false,
  hidePullFromPostmaster: false,
  itemSortReversals: [],
};
