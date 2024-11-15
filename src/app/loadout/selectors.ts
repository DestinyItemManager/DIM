import { currentProfileSelector } from 'app/dim-api/selectors';
import { DimItem } from 'app/inventory/item-types';
import { getHashtagsFromString } from 'app/inventory/note-hashtags';
import {
  allItemsSelector,
  currentStoreSelector,
  sortedStoresSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { allInGameLoadoutsSelector } from 'app/loadout/ingame/selectors';
import { manifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { isClassCompatible } from 'app/utils/item-utils';
import { createSelector } from 'reselect';
import {
  getInstancedLoadoutItem,
  getResolutionInfo,
  getUninstancedLoadoutItem,
} from '../loadout-drawer/loadout-utils';
import { InGameLoadout, Loadout, LoadoutItem, isInGameLoadout } from './loadout-types';
import { loadoutsSelector } from './loadouts-selector';

export const loadoutsHashtagsSelector = createSelector(loadoutsSelector, (loadouts) => [
  ...new Set(loadouts.flatMap((loadout) => getHashtagsFromString(loadout.name, loadout.notes))),
]);

export interface LoadoutsByItem {
  [itemId: string]: { loadout: Loadout | InGameLoadout; loadoutItem: LoadoutItem }[] | undefined;
}

/**
 * A map from item instance IDs to a list of loadouts this item
 * appears in. Due to resolution of uninstanced items, it's totally
 * possible that a LoadoutItem in a global loadout resolves to
 * different items depending on the store, so this caches resolution results.
 */
export const loadoutsByItemSelector = createSelector(
  manifestSelector,
  loadoutsSelector,
  allInGameLoadoutsSelector,
  storesSelector,
  allItemsSelector,
  (definitions, loadouts, inGameLoadouts, stores, allItems) => {
    const loadoutsForItems: LoadoutsByItem = {};
    if (!definitions) {
      return loadoutsForItems;
    }

    const recordLoadout = (
      itemId: string,
      loadout: Loadout | InGameLoadout,
      loadoutItem: LoadoutItem,
    ) => {
      const loadoutsForItem = (loadoutsForItems[itemId] ??= []);
      if (!loadoutsForItem.some((l) => l.loadout.id === loadout.id)) {
        loadoutsForItem.push({ loadout, loadoutItem });
      }
    };

    for (const loadout of loadouts) {
      for (const loadoutItem of loadout.items) {
        const info = getResolutionInfo(definitions, loadoutItem.hash);
        if (info) {
          if (info.instanced) {
            const result = getInstancedLoadoutItem(allItems, loadoutItem);
            if (result) {
              recordLoadout(result.id, loadout, loadoutItem);
            }
          } else {
            // Otherwise, we resolve the item from the perspective of all
            // applicable stores for the loadout and associate every resolved
            // instance ID with the loadout.
            for (const store of stores) {
              if (!store.isVault && isClassCompatible(store.classType, loadout.classType)) {
                const resolvedItem = getUninstancedLoadoutItem(allItems, info.hash, store.id);
                if (resolvedItem) {
                  recordLoadout(resolvedItem.id, loadout, loadoutItem);
                }
              }
            }
          }
        }
      }
    }

    for (const loadout of inGameLoadouts) {
      for (const loadoutItem of loadout.items) {
        const result = allItems.find((item) => item.id === loadoutItem.itemInstanceId);
        if (result) {
          recordLoadout(result.id, loadout, {
            id: result.id,
            hash: result.hash,
            amount: 1,
            equip: true,
          });
        }
      }
    }

    return loadoutsForItems;
  },
);

/**
 * Returns a function that determines if an item is in an
 * in-game loadout that belongs to a specific character
 */
export const isInInGameLoadoutForSelector = createSelector(
  loadoutsByItemSelector,
  (loadoutsByItem) => (item: DimItem, ownerId: string) =>
    Boolean(
      loadoutsByItem[item.id]?.some(
        (l) => isInGameLoadout(l.loadout) && l.loadout.characterId === ownerId,
      ),
    ),
);

export const previousLoadoutSelector =
  (storeId: string) =>
  (state: RootState): Loadout | undefined => {
    if (state.loadouts.previousLoadouts[storeId]) {
      return state.loadouts.previousLoadouts[storeId].at(-1);
    }
    return undefined;
  };

export const selectedLoadoutStoreSelector = createSelector(
  sortedStoresSelector,
  currentStoreSelector,
  (rootState: RootState) => rootState.loadouts.selectedLoadoutStoreId,
  (stores, currentStore, selectedLoadoutStoreId): DimStore => {
    const defaultStore = currentStore || stores[0];
    if (selectedLoadoutStoreId === undefined) {
      return defaultStore;
    }
    return stores.find((store) => store.id === selectedLoadoutStoreId) ?? defaultStore;
  },
);

/**
 * Is this loadout ID saved to the user's profile? This doesn't mean it's been
 * flushed to DIM Sync yet but just that it's been saved locally.
 */
export const loadoutSavedSelector = (loadoutId: string) => (state: RootState) =>
  Boolean(currentProfileSelector(state)?.loadouts[loadoutId]);
