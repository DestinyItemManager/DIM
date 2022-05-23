import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';
import { Settings } from './initial-settings';

export type ItemSortSettings = {
  sortOrder: Settings['itemSortOrderCustom'];
  sortReversals: Settings['itemSortReversals'];
};

const itemSortOrderCustomSelector = (state: RootState) =>
  settingsSelector(state).itemSortOrderCustom;
const itemSortReversalsSelector = (state: RootState) => settingsSelector(state).itemSortReversals;

export const itemSortSettingsSelector = createSelector(
  itemSortOrderCustomSelector,
  itemSortReversalsSelector,
  (itemSortOrderCustom, itemSortReversals) => ({
    sortOrder: itemSortOrderCustom || ['primStat', 'name'],
    sortReversals: itemSortReversals || [],
  })
);
