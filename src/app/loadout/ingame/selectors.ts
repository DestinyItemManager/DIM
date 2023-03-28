import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  createItemContextSelector,
  gatherUnlockedPlugSetItems,
  profileResponseSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { getStore } from 'app/inventory/stores-helpers';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { convertDestinyLoadoutComponentToInGameLoadout } from 'app/loadout-drawer/loadout-type-converters';
import {
  InGameLoadout,
  Loadout,
  ResolvedLoadoutItem,
  ResolvedLoadoutMod,
} from 'app/loadout-drawer/loadout-types';
import { getModsFromLoadout, newLoadoutFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/loadouts-selector';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { t } from 'i18next';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { filterLoadoutsToClass } from '../loadout-ui/menu-hooks';
import { implementsDimLoadout, itemCouldBeEquipped } from './ingame-loadout-utils';

/** All loadouts relevant to a specific storeId, resolved to actual mods, and actual items */
export const fullyResolvedLoadoutsSelector = createSelector(
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
          fullyResolveLoadout(storeId, loadout, defs, unlockedPlugs, itemCreationContext, allItems)
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

/** All loadouts supported directly by D2 (post-Lightfall), on any character */
export const allInGameLoadoutsSelector = createSelector(
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
export const inGameLoadoutsForCharacterSelector = createSelector(
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

/** Loadouts supported directly by D2 (post-Lightfall), for a specific character */
export const inGameLoadoutsWithMetadataSelector = createSelector(
  inGameLoadoutsForCharacterSelector,
  fullyResolvedLoadoutsSelector,
  allItemsSelector,
  storesSelector,
  (_state: RootState, storeId: string) => storeId,
  (inGameLoadouts, { currentLoadout, loadouts: savedLoadouts }, allItems, stores, storeId) => {
    const selectedStore = getStore(stores, storeId)!;
    return inGameLoadouts.map((gameLoadout) => {
      const isEquippable = gameLoadout.items.every((li) => {
        const liveItem = allItems.find((di) => di.id === li.itemInstanceId);
        return !liveItem || itemCouldBeEquipped(selectedStore, liveItem, stores);
      });
      const isEquipped = implementsDimLoadout(
        gameLoadout,
        currentLoadout.resolvedLoadoutItems,
        currentLoadout.resolvedMods
      );

      const matchingLoadouts = savedLoadouts.filter(
        (dimLoadout) =>
          dimLoadout.loadout.items.length > 4 &&
          implementsDimLoadout(
            gameLoadout,
            dimLoadout.resolvedLoadoutItems,
            dimLoadout.resolvedMods
          )
      );
      return { gameLoadout, isEquippable, isEquipped, matchingLoadouts };
    });
  }
);
