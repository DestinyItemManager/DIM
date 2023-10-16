import { settingsSelector } from 'app/dim-api/selectors';
import { DimItem } from 'app/inventory/item-types';
import { getTagSelector } from 'app/inventory/selectors';
import { groupItems } from 'app/shell/item-comparators';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';

export const vaultWeaponGroupingSettingSelector = (state: RootState) =>
  settingsSelector(state).vaultWeaponGrouping;

/**
 * Get a function that will group items according to the user's preferences.
 */
export const vaultWeaponGroupingSelector = createSelector(
  vaultWeaponGroupingSettingSelector,
  getTagSelector,
  (vaultWeaponGrouping, getTag) => (items: readonly DimItem[]) => {
    if (!vaultWeaponGrouping) {
      return items;
    }

    return groupItems(items, vaultWeaponGrouping, getTag);
  }
);
