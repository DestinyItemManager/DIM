import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import { Settings } from './initial-settings';

export const itemSortOrder = (settings: Settings): string[] =>
  settings.itemSortOrderCustom || ['primStat', 'name'];

export const itemSortOrderSelector = (state: RootState) => itemSortOrder(settingsSelector(state));
