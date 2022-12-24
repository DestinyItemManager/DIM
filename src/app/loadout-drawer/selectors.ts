import { currentProfileSelector } from 'app/dim-api/selectors';
import { allItemsSelector, storesSelector } from 'app/inventory/selectors';
import { manifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { convertDimApiLoadoutToLoadout } from './loadout-type-converters';
import { Loadout, LoadoutItem } from './loadout-types';
import {
  getInstancedLoadoutItem,
  getResolutionInfo,
  getUninstancedLoadoutItem,
} from './loadout-utils';

/** All loadouts relevant to the current account */
export const loadoutsSelector = createSelector(
  (state: RootState) => currentProfileSelector(state)?.loadouts,
  (loadouts) =>
    loadouts
      ? Object.values(loadouts).map((loadout) => convertDimApiLoadoutToLoadout(loadout))
      : emptyArray<Loadout>()
);

export interface LoadoutsByItem {
  [itemId: string]: { loadout: Loadout; loadoutItem: LoadoutItem }[] | undefined;
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
  storesSelector,
  allItemsSelector,
  (definitions, loadouts, stores, allItems) => {
    const loadoutsForItems: LoadoutsByItem = {};
    if (!definitions) {
      return loadoutsForItems;
    }

    const recordLoadout = (itemId: string, loadout: Loadout, loadoutItem: LoadoutItem) => {
      if (!loadoutsForItems[itemId]?.some((l) => l.loadout.id === loadout.id)) {
        (loadoutsForItems[itemId] ??= []).push({ loadout, loadoutItem });
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
              if (
                store.classType !== DestinyClass.Unknown &&
                (loadout.classType === DestinyClass.Unknown ||
                  loadout.classType === store.classType)
              ) {
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

    return loadoutsForItems;
  }
);

export const previousLoadoutSelector =
  (storeId: string) =>
  (state: RootState): Loadout | undefined => {
    if (state.loadouts.previousLoadouts[storeId]) {
      return _.last(state.loadouts.previousLoadouts[storeId]);
    }
    return undefined;
  };
