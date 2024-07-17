import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  createItemContextSelector,
  profileResponseSelector,
  storesSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { getStore } from 'app/inventory/stores-helpers';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import {
  getModsFromLoadout,
  itemsByItemId,
  newLoadoutFromEquipped,
} from 'app/loadout-drawer/loadout-utils';
import {
  InGameLoadout,
  Loadout,
  ResolvedLoadoutItem,
  ResolvedLoadoutMod,
} from 'app/loadout/loadout-types';
import { loadoutsForClassTypeSelector } from 'app/loadout/loadouts-selector';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { createSelector } from 'reselect';
import { implementsDimLoadout, itemCouldBeEquipped } from './ingame-loadout-utils';

/** A DIM loadout with all of its parameters resolved to real inventory. */
export interface FullyResolvedLoadout {
  loadout: Loadout;
  resolvedMods: ResolvedLoadoutMod[];
  resolvedLoadoutItems: ResolvedLoadoutItem[];
  failedResolvedLoadoutItems: ResolvedLoadoutItem[];
}

/** All loadouts relevant to a specific storeId, resolved to actual mods, and actual items */
const fullyResolvedLoadoutsSelector = createSelector(
  (_state: RootState, storeId: string) => storeId,
  (state: RootState, storeId: string) => {
    const stores = storesSelector(state);
    const classType = getStore(stores, storeId)!.classType;
    return loadoutsForClassTypeSelector(classType)(state);
  },
  storesSelector,
  d2ManifestSelector,
  createItemContextSelector,
  allItemsSelector,
  unlockedPlugSetItemsSelector.selector,
  (storeId, savedLoadouts, stores, defs, itemCreationContext, allItems, unlockedPlugs) => {
    const selectedStore = getStore(stores, storeId)!;

    const loadouts = savedLoadouts
      ? savedLoadouts.map((loadout) =>
          fullyResolveLoadout(storeId, loadout, defs, unlockedPlugs, itemCreationContext, allItems),
        )
      : emptyArray<FullyResolvedLoadout>();
    const currentLoadout = fullyResolveLoadout(
      storeId,
      newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore, undefined),
      defs,
      unlockedPlugs,
      itemCreationContext,
      allItems,
    );
    return { loadouts, currentLoadout };
  },
);

export function fullyResolveLoadout(
  storeId: string,
  loadout: Loadout,
  defs: D2ManifestDefinitions | undefined,
  unlockedPlugs: Set<number>,
  itemCreationContext: ItemCreationContext,
  allItems: DimItem[],
): FullyResolvedLoadout {
  const resolvedMods = getModsFromLoadout(defs, loadout, unlockedPlugs);
  const [resolvedLoadoutItems, failedResolvedLoadoutItems] = getItemsFromLoadoutItems(
    itemCreationContext,
    loadout.items,
    storeId,
    allItems,
  );

  return { loadout, resolvedMods, resolvedLoadoutItems, failedResolvedLoadoutItems };
}

const inGameLoadoutsSelector = (state: RootState) => state.inGameLoadouts.loadouts;
const characterLoadoutsSelector = (state: RootState) =>
  profileResponseSelector(state)?.characterLoadouts?.data;

/** All loadouts supported directly by D2 (post-Lightfall), on any character */
export const allInGameLoadoutsSelector = createSelector(
  inGameLoadoutsSelector,
  (loadouts): InGameLoadout[] => Object.values(loadouts).flat(),
);

/** Loadouts supported directly by D2 (post-Lightfall), for a specific character */
export const inGameLoadoutsForCharacterSelector = createSelector(
  inGameLoadoutsSelector,
  (_state: RootState, characterId: string) => characterId,
  (loadouts, characterId): InGameLoadout[] => loadouts[characterId] ?? emptyArray<InGameLoadout>(),
);

/**
 * How many loadout slots has the user unlocked? We get this directly from the profile because we
 * want to count all loadouts, even the empty ones.
 */
export const availableLoadoutSlotsSelector = createSelector(
  characterLoadoutsSelector,
  (loadouts) => (loadouts ? (Object.values(loadouts)[0]?.loadouts.length ?? 0) : 0),
);

/** Loadouts supported directly by D2 (post-Lightfall), for a specific character */
export const inGameLoadoutsWithMetadataSelector = createSelector(
  inGameLoadoutsForCharacterSelector,
  fullyResolvedLoadoutsSelector,
  allItemsSelector,
  storesSelector,
  availableLoadoutSlotsSelector,
  (_state: RootState, storeId: string) => storeId,
  (
    inGameLoadouts,
    { currentLoadout, loadouts: savedLoadouts },
    allItems,
    stores,
    availableLoadoutSlots,
    storeId,
  ) => {
    const selectedStore = getStore(stores, storeId)!;

    return (
      inGameLoadouts
        // seems unlikely the game would return valid, itemful loadouts for slots you haven't earned,
        // but we respect this setting by filtering out any loadout whose index defies how many you have supposedly unlocked.
        // inGameLoadoutsForCharacterSelector filters out empty loadouts, so we have to go by their self-stated index, not by array length
        .filter((gameLoadout) => gameLoadout.index < availableLoadoutSlots)
        .map((gameLoadout) => {
          const isEquippable = gameLoadout.items.every((li) => {
            const liveItem = itemsByItemId(allItems)[li.itemInstanceId];
            return !liveItem || itemCouldBeEquipped(selectedStore, liveItem, stores);
          });

          const isEquipped = implementsDimLoadout(
            gameLoadout,
            currentLoadout.resolvedLoadoutItems,
            currentLoadout.resolvedMods,
          );

          const matchingLoadouts = savedLoadouts.filter((dimLoadout) =>
            implementsDimLoadout(
              gameLoadout,
              dimLoadout.resolvedLoadoutItems,
              dimLoadout.resolvedMods,
            ),
          );
          return { gameLoadout, isEquippable, isEquipped, matchingLoadouts };
        })
    );
  },
);
