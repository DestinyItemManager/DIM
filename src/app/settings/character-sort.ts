import { RootState } from 'app/store/types';
import { DimStore } from '../inventory/store-types';
import _ from 'lodash';
import { DestinyCharacterComponent } from 'bungie-api-ts/destiny2';
import { createSelector } from 'reselect';
import { settingsSelector } from './reducer';

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

export const characterComponentSortSelector = createSelector(
  characterOrderSelector,
  customCharacterSortSelector,
  (order, customCharacterSort) => {
    switch (order) {
      case 'mostRecent':
        return (stores: DestinyCharacterComponent[]) =>
          _.sortBy(stores, (store) => new Date(store.dateLastPlayed)).reverse();

      case 'mostRecentReverse':
        return (stores: DestinyCharacterComponent[]) =>
          _.sortBy(stores, (store) => new Date(store.dateLastPlayed));

      case 'custom': {
        const customSortOrder = customCharacterSort;
        return (stores: DestinyCharacterComponent[]) =>
          _.sortBy(stores, (s) => customSortOrder.indexOf(s.characterId));
      }

      default:
      case 'fixed': // "Age"
        // https://github.com/Bungie-net/api/issues/614
        return (stores: DestinyCharacterComponent[]) => _.sortBy(stores, (s) => s.characterId);
    }
  }
);
