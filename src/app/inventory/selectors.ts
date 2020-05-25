import { RootState } from '../store/reducers';
import { createSelector } from 'reselect';
import { characterSortSelector } from '../settings/character-sort';
import _ from 'lodash';
import { currentProfileSelector } from 'app/dim-api/selectors';
import { emptyObject } from 'app/utils/empty';
import { getCurrentStore } from './stores-helpers';
import { ItemInfos } from './dim-item-info';

/** All stores, unsorted. */
export const storesSelector = (state: RootState) => state.inventory.stores;

/** All stores, sorted according to user preference. */
export const sortedStoresSelector = createSelector(
  storesSelector,
  characterSortSelector,
  (stores, sortStores) => sortStores(stores)
);

/** Have stores been loaded? */
export const storesLoadedSelector = (state: RootState) => storesSelector(state).length > 0;

/** The current (last played) character */
export const currentStoreSelector = (state: RootState) => getCurrentStore(storesSelector(state));

/** A set containing all the hashes of owned items. */
export const ownedItemsSelector = () =>
  createSelector(storesSelector, (stores) => {
    const ownedItemHashes = new Set<number>();
    for (const store of stores) {
      for (const item of store.items) {
        ownedItemHashes.add(item.hash);
      }
    }
    return ownedItemHashes;
  });

/** The actual raw profile response from the Bungie.net profile API */
export const profileResponseSelector = (state: RootState) => state.inventory.profileResponse;

/** Item infos (tags/notes) */
export const itemInfosSelector = (state: RootState): ItemInfos =>
  currentProfileSelector(state)?.tags || emptyObject();
