import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import { Settings } from './initial-settings';

export const itemSortSettings = (settings: Settings) => ({
  sortOrder: settings.itemSortOrderCustom || ['primStat', 'name'],
  sortReversals: settings.itemSortReversals || [],
});

export const itemSortSettingsSelector = (state: RootState) =>
  itemSortSettings(settingsSelector(state));
