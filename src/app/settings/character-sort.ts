import { CharacterOrder } from '@destinyitemmanager/dim-api-types';
import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import { compareBy, compareByIndex, reverseComparator } from 'app/utils/comparators';
import { createSelector } from 'reselect';
import { DimStore } from '../inventory/store-types';

export const characterOrderSelector = (state: RootState) => settingsSelector(state).characterOrder;
const customCharacterSortSelector = (state: RootState) =>
  settingsSelector(state).customCharacterSort;

function sortCharacters(
  order: CharacterOrder,
  customCharacterSort: string[],
): (stores: readonly DimStore[]) => DimStore[] {
  switch (order) {
    case 'mostRecent':
      return (stores) =>
        stores.toSorted(reverseComparator(compareBy((store) => store.lastPlayed.getTime())));

    case 'mostRecentReverse':
      return (stores) =>
        stores.toSorted(
          compareBy((store) => {
            if (store.isVault) {
              return Infinity;
            } else {
              return store.lastPlayed.getTime();
            }
          }),
        );

    case 'custom': {
      const customSortOrder = customCharacterSort;
      return (stores) => stores.toSorted(compareByIndex(customSortOrder, (s) => s.id));
    }

    default:
    case 'fixed': // "Age"
      // https://github.com/Bungie-net/api/issues/614
      return (stores) => stores.toSorted(compareBy((s) => s.id));
  }
}

export const characterSortSelector = createSelector(
  characterOrderSelector,
  customCharacterSortSelector,
  sortCharacters,
);

/**
 * This sorts stores by "importance" rather than how they display as columns. This is for
 * dropdowns and such where "mostRecentReverse" still implies that the most recent character
 * is most important.
 */
export const characterSortImportanceSelector = createSelector(
  characterOrderSelector,
  customCharacterSortSelector,
  (order, customCharacterSort) =>
    sortCharacters(order === 'mostRecentReverse' ? 'mostRecent' : order, customCharacterSort),
);
