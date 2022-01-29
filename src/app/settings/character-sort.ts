import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { DimStore } from '../inventory-stores/store-types';

export const characterOrderSelector = (state: RootState) => settingsSelector(state).characterOrder;
const customCharacterSortSelector = (state: RootState) =>
  settingsSelector(state).customCharacterSort;

export const characterSortSelector = createSelector(
  characterOrderSelector,
  customCharacterSortSelector,
  (order, customCharacterSort) => {
    switch (order) {
      case 'mostRecent':
        return (stores: DimStore[]) => _.sortBy(stores, (store) => store.lastPlayed).reverse();

      case 'mostRecentReverse':
        return (stores: DimStore[]) =>
          _.sortBy(stores, (store) => {
            if (store.isVault) {
              return Infinity;
            } else {
              return store.lastPlayed;
            }
          });

      case 'custom': {
        const customSortOrder = customCharacterSort;
        return (stores: DimStore[]) =>
          _.sortBy(stores, (s) => (s.isVault ? 999 : customSortOrder.indexOf(s.id)));
      }

      default:
      case 'fixed': // "Age"
        // https://github.com/Bungie-net/api/issues/614
        return (stores: DimStore[]) => _.sortBy(stores, (s) => s.id);
    }
  }
);

/**
 * This sorts stores by "importance" rather than how they display as columns. This is for
 * dropdowns and such where "mostRecentReverse" still implies that the most recent character
 * is most important.
 */
export const characterSortImportanceSelector = createSelector(
  characterOrderSelector,
  customCharacterSortSelector,
  (order, customCharacterSort) => {
    switch (order) {
      case 'mostRecent':
      case 'mostRecentReverse':
        return (stores: DimStore[]) => _.sortBy(stores, (store) => store.lastPlayed).reverse();

      case 'custom': {
        const customSortOrder = customCharacterSort;
        return (stores: DimStore[]) =>
          _.sortBy(stores, (s) => (s.isVault ? 999 : customSortOrder.indexOf(s.id)));
      }

      default:
      case 'fixed': // "Age"
        // https://github.com/Bungie-net/api/issues/614
        return (stores: DimStore[]) => _.sortBy(stores, (s) => s.id);
    }
  }
);
