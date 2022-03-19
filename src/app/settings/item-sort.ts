import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import { Settings } from './initial-settings';

export type ItemSortSettings = {
  sortOrder: Settings['itemSortOrderCustom'];
  sortReversals: Settings['itemSortReversals'];
};

export const itemSortSettings: (settings: Settings) => ItemSortSettings = (settings: Settings) => ({
  sortOrder: settings.itemSortOrderCustom || ['primStat', 'name'],
  sortReversals: settings.itemSortReversals || [],
});

export const itemSortSettingsSelector = (state: RootState) =>
  itemSortSettings(settingsSelector(state));
