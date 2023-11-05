import { settingsSelector } from 'app/dim-api/selectors';
import { DimItem } from 'app/inventory/item-types';
import { getTagSelector } from 'app/inventory/selectors';
import { sortItems } from 'app/shell/item-comparators';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';
import { Settings } from './initial-settings';

export interface ItemSortSettings {
  sortOrder: Settings['itemSortOrderCustom'];
  sortReversals: Settings['itemSortReversals'];
}

const itemSortOrderCustomSelector = (state: RootState) =>
  settingsSelector(state).itemSortOrderCustom;
const itemSortReversalsSelector = (state: RootState) => settingsSelector(state).itemSortReversals;

export const itemSortSettingsSelector = createSelector(
  itemSortOrderCustomSelector,
  itemSortReversalsSelector,
  (itemSortOrderCustom, itemSortReversals) => ({
    sortOrder: itemSortOrderCustom || ['primStat', 'name'],
    sortReversals: itemSortReversals || [],
  }),
);

/**
 * Get a function that will sort items according to the user's preferences.
 */
export const itemSorterSelector = createSelector(
  itemSortSettingsSelector,
  getTagSelector,
  (sortSettings, getTag) => (items: readonly DimItem[]) => sortItems(items, sortSettings, getTag),
);
