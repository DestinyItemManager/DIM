import { currentProfileSelector } from 'app/dim-api/selectors';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import {
  allItemsSelector,
  bucketsSelector,
  profileResponseSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getStore } from 'app/inventory/stores-helpers';
import { d2ManifestSelector, manifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { DestinyClass, DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { createSelector } from 'reselect';
import {
  convertDestinyLoadoutComponentToInGameLoadout,
  convertDimApiLoadoutToLoadout,
} from './loadout-type-converters';
import { InGameLoadout, Loadout, LoadoutItem } from './loadout-types';
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

export const loadoutsHashtagsSelector = createSelector(loadoutsSelector, (loadouts) => [
  ...new Set(
    loadouts.flatMap((loadout) => [
      ...getHashtagsFromNote(loadout.name),
      ...getHashtagsFromNote(loadout.notes),
    ])
  ),
]);

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

/** All loadouts supported directly by D2 (post-Lightfall), on any character */
export const allInGameLoadoutsSelector = $featureFlags.simulateInGameLoadouts
  ? createSelector(allItemsSelector, storesSelector, bucketsSelector, (items, stores, buckets) =>
      stores.flatMap((s) =>
        s.isVault
          ? []
          : new Array(4).fill(0).map((_, i) => generateFakeLoadout(items, s, buckets!, i))
      )
    )
  : createSelector(
      d2ManifestSelector,
      (state: RootState) => profileResponseSelector(state)?.characterLoadouts?.data,
      (defs, loadouts): InGameLoadout[] =>
        defs && loadouts
          ? Object.entries(loadouts).flatMap(([characterId, c]) =>
              _.compact(
                c.loadouts.map((l, i) =>
                  convertDestinyLoadoutComponentToInGameLoadout(l, i, characterId, defs)
                )
              )
            )
          : emptyArray<InGameLoadout>()
    );

/** Loadouts supported directly by D2 (post-Lightfall), for a specific character */
export const inGameLoadoutsForCharacterSelector = $featureFlags.simulateInGameLoadouts
  ? createSelector(
      allItemsSelector,
      storesSelector,
      bucketsSelector,
      (_state: RootState, characterId: string) => characterId,
      (items, stores, buckets, characterId) => {
        const store = getStore(stores, characterId)!;
        return new Array(4).fill(0).map((_, i) => generateFakeLoadout(items, store, buckets!, i));
      }
    )
  : createSelector(
      d2ManifestSelector,
      (state: RootState) => profileResponseSelector(state)?.characterLoadouts?.data,
      (_state: RootState, characterId: string) => characterId,
      (defs, loadouts, characterId): InGameLoadout[] =>
        (defs &&
          _.compact(
            loadouts?.[characterId]?.loadouts.map((l, i) =>
              convertDestinyLoadoutComponentToInGameLoadout(l, i, characterId, defs)
            )
          )) ??
        emptyArray<InGameLoadout>()
    );

function generateFakeLoadout(
  items: DimItem[],
  store: DimStore,
  buckets: InventoryBuckets,
  index: number
): InGameLoadout {
  const loadoutItems = [...buckets.byCategory.Weapons, ...buckets.byCategory.Armor].map(
    (b): DestinyLoadoutItemComponent => {
      const item = _.shuffle(
        items.filter((i) => i.bucket.hash === b.hash && itemCanBeEquippedBy(i, store, false))
      )[0]!;
      return {
        itemInstanceId: item.id,
        plugItemHashes: _.compact(item.sockets?.allSockets.map((s) => s.plugged?.plugDef.hash)),
      };
    }
  );

  return {
    name: 'Test Name',
    icon: '/common/destiny2_content/icons/32301dcfb9758fae4830c7b9f7cba1d3.jpg',
    colorIcon: '/common/destiny2_content/icons/32301dcfb9758fae4830c7b9f7cba1d3.jpg',
    iconHash: 1,
    nameHash: 1,
    colorHash: 1,
    items: loadoutItems,
    characterId: store.id,
    index,
    id: `ingame-${store.id}-${index}`,
  };
}
