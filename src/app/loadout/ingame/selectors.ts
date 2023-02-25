import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  bucketsSelector,
  profileResponseSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getStore } from 'app/inventory/stores-helpers';
import { convertDestinyLoadoutComponentToInGameLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { createSelector } from 'reselect';

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
