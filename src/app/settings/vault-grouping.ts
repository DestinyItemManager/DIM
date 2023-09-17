import { settingsSelector } from 'app/dim-api/selectors';
import { DimItem } from 'app/inventory/item-types';
import { getTagSelector } from 'app/inventory/selectors';
import { groupItems } from 'app/shell/item-comparators';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';

export const vaultGroupingSettingSelector = (state: RootState) =>
  settingsSelector(state).vaultGrouping;

export const vaultGroupingDisplaySettingSelector = (state: RootState) =>
  settingsSelector(state).vaultGroupingDisplay;

/**
 * Get a function that will sort items according to the user's preferences.
 */
export const vaultGroupingSelector = createSelector(
  vaultGroupingSettingSelector,
  getTagSelector,
  (vaultGrouping, getTag) => (items: readonly DimItem[]) => {
    if (!vaultGrouping) {
      return items;
    }

    return groupItems(items, vaultGrouping, getTag);
  }
);
