import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { currentProfileSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import {
  allItemsSelector,
  createItemContextSelector,
  gatherUnlockedPlugSetItems,
  profileResponseSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { allInGameLoadoutsSelector } from 'app/loadout/ingame/selectors';
import { filterLoadoutsToClass } from 'app/loadout/loadout-ui/menu-hooks';
import { d2ManifestSelector, manifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { currySelector } from 'app/utils/selector-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { getItemsFromLoadoutItems } from './loadout-item-conversion';
import { convertDimApiLoadoutToLoadout } from './loadout-type-converters';
import {
  InGameLoadout,
  Loadout,
  LoadoutItem,
  ResolvedLoadoutItem,
  ResolvedLoadoutMod,
} from './loadout-types';
import {
  getInstancedLoadoutItem,
  getModsFromLoadout,
  getResolutionInfo,
  getUninstancedLoadoutItem,
  newLoadoutFromEquipped,
} from './loadout-utils';

/** All loadouts relevant to the current account */
export const loadoutsSelector = createSelector(
  (state: RootState) => currentProfileSelector(state)?.loadouts,
  (loadouts) =>
    loadouts
      ? Object.values(loadouts).map((loadout) => convertDimApiLoadoutToLoadout(loadout))
      : emptyArray<Loadout>()
);

/** All loadouts relevant to a specific storeId, resolved to actual mods, and actual items */
export const fullyResolvedLoadoutsSelector = currySelector(
  createSelector(
    (_state: RootState, storeId: string) => storeId,
    storesSelector,
    loadoutsSelector,
    d2ManifestSelector,
    profileResponseSelector,
    createItemContextSelector,
    allItemsSelector,
    (storeId, stores, allLoadouts, defs, profileResponse, itemCreationContext, allItems) => {
      const selectedStore = stores.find((s) => s.id === storeId)!;
      const savedLoadouts = filterLoadoutsToClass(allLoadouts, selectedStore.classType);
      const unlockedPlugs = gatherUnlockedPlugSetItems(storeId, profileResponse);

      const loadouts = savedLoadouts
        ? savedLoadouts.map((loadout) =>
            fullyResolveLoadout(
              storeId,
              loadout,
              defs,
              unlockedPlugs,
              itemCreationContext,
              allItems
            )
          )
        : emptyArray<{
            loadout: Loadout;
            resolvedMods: ResolvedLoadoutMod[];
            resolvedLoadoutItems: ResolvedLoadoutItem[];
            failedResolvedLoadoutItems: ResolvedLoadoutItem[];
          }>();
      const currentLoadout = fullyResolveLoadout(
        storeId,
        newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore),
        defs,
        unlockedPlugs,
        itemCreationContext,
        allItems
      );
      return { loadouts, currentLoadout };
    }
  )
);

function fullyResolveLoadout(
  storeId: string,
  loadout: Loadout,
  defs: D2ManifestDefinitions | undefined,
  unlockedPlugs: Set<number>,
  itemCreationContext: ItemCreationContext,
  allItems: DimItem[]
) {
  const resolvedMods = getModsFromLoadout(defs, loadout, unlockedPlugs);
  const [resolvedLoadoutItems, failedResolvedLoadoutItems] = getItemsFromLoadoutItems(
    itemCreationContext,
    loadout.items,
    storeId,
    allItems
  );

  return { loadout, resolvedMods, resolvedLoadoutItems, failedResolvedLoadoutItems };
}

export const loadoutsHashtagsSelector = createSelector(loadoutsSelector, (loadouts) => [
  ...new Set(
    loadouts.flatMap((loadout) => [
      ...getHashtagsFromNote(loadout.name),
      ...getHashtagsFromNote(loadout.notes),
    ])
  ),
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
      loadoutItem: LoadoutItem
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
