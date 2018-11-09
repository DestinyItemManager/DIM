import { RootState } from '../store/reducers';
import { DimStore } from '../inventory/store-types';
import * as _ from 'lodash';
import { DestinyCharacterComponent } from 'bungie-api-ts/destiny2';

export const characterSortSelector = (state: RootState) => {
  const order = state.settings.characterOrder;

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

    case 'custom':
      const customSortOrder = state.settings.customCharacterSort;
      return (stores: DimStore[]) =>
        _.sortBy(stores, (s) => (s.isVault ? 999 : customSortOrder.indexOf(s.id)));

    default:
    case 'fixed': // "Age"
      // https://github.com/Bungie-net/api/issues/614
      return (stores: DimStore[]) => _.sortBy(stores, (s) => s.id);
  }
};

export const characterComponentSortSelector = (state: RootState) => {
  const order = state.settings.characterOrder;

  switch (order) {
    case 'mostRecent':
      return (stores: DestinyCharacterComponent[]) =>
        _.sortBy(stores, (store) => new Date(store.dateLastPlayed)).reverse();

    case 'mostRecentReverse':
      return (stores: DestinyCharacterComponent[]) =>
        _.sortBy(stores, (store) => {
          return new Date(store.dateLastPlayed);
        });

    case 'custom':
      const customSortOrder = state.settings.customCharacterSort;
      return (stores: DestinyCharacterComponent[]) =>
        _.sortBy(stores, (s) => customSortOrder.indexOf(s.characterId));

    default:
    case 'fixed': // "Age"
      // https://github.com/Bungie-net/api/issues/614
      return (stores: DestinyCharacterComponent[]) => _.sortBy(stores, (s) => s.characterId);
  }
};
