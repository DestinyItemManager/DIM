import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, createItemContextSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import { spaceLeftForItem } from 'app/inventory/stores-helpers';
import { convertInGameLoadoutPlugItemHashesToSocketOverrides } from 'app/loadout-drawer/loadout-type-converters';
import {
  InGameLoadout,
  ResolvedLoadoutItem,
  ResolvedLoadoutMod,
} from 'app/loadout-drawer/loadout-types';
import { potentialLoadoutItemsByItemId } from 'app/loadout-drawer/loadout-utils';
import { DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { UNSET_PLUG_HASH } from '../known-values';

/**
 * Get all the real DimItems from ingame loadout items.
 */
export function getItemsFromInGameLoadout(
  itemCreationContext: ItemCreationContext,
  loadoutItems: DestinyLoadoutItemComponent[],
  allItems: DimItem[]
): ResolvedLoadoutItem[] {
  return _.compact(
    loadoutItems.map((li) => {
      const realItem =
        li.itemInstanceId !== '0'
          ? potentialLoadoutItemsByItemId(allItems)[li.itemInstanceId]
          : undefined;
      if (!realItem) {
        // We just skip missing items entirely - we can't find anything about them
        return undefined;
      }
      const socketOverrides = convertInGameLoadoutPlugItemHashesToSocketOverrides(
        li.plugItemHashes
      );
      const item = applySocketOverrides(itemCreationContext, realItem, socketOverrides);
      return {
        item,
        loadoutItem: {
          socketOverrides,
          hash: item.hash,
          id: item.id,
          equip: true,
          amount: 1,
        },
      };
    })
  );
}

/**
 * Hook version of getItemsFromLoadouts
 */
export function useItemsFromInGameLoadout(loadout: InGameLoadout) {
  const allItems = useSelector(allItemsSelector);
  const itemCreationContext = useSelector(createItemContextSelector);
  return useMemo(
    () => getItemsFromInGameLoadout(itemCreationContext, loadout.items, allItems),
    [itemCreationContext, loadout.items, allItems]
  );
}

export const gameLoadoutCompatibleBuckets = [
  BucketHashes.Subclass,
  ...D2Categories.Weapons,
  ...D2Categories.Armor,
];

/**
 * does this game loadout, meet the requirements of this DIM loadout:
 *
 * does it include the items the DIM loadout would equip,
 * and represent a full application of the DIM loadout's required mods?
 */
export function implementsDimLoadout(
  inGameLoadout: InGameLoadout,
  dimResolvedLoadoutItems: ResolvedLoadoutItem[],
  resolvedMods: ResolvedLoadoutMod[]
) {
  const equippedDimItems = dimResolvedLoadoutItems
    .filter((rli) => {
      if (!rli.loadoutItem.equip) {
        return false;
      }
      // only checking the items that game loadouts support
      return gameLoadoutCompatibleBuckets.includes(rli.item.bucket.hash);
    })
    .map((i) => i.item.id);
  const equippedGameItems = inGameLoadout.items.map((i) => i.itemInstanceId);

  // try the faster quit
  if (!equippedDimItems.every((i) => equippedGameItems.includes(i))) {
    return false;
  }

  const gameLoadoutMods = inGameLoadout.items
    .flatMap((i) => i.plugItemHashes)
    .filter(isValidGameLoadoutPlug);

  const dimLoadoutMods = resolvedMods.map((m) => m.resolvedMod.hash);
  for (const requiredModHash of dimLoadoutMods) {
    const pos = gameLoadoutMods.indexOf(requiredModHash);
    if (pos === -1) {
      return false;
    }
    gameLoadoutMods.splice(pos, 1);
  }
  return true;
}

/**
 * to be equipped via in-game loadouts, an item must be on the char already,
 * or in the vault, but with room in the character's pockets for a transfer
 */
export function itemCouldBeEquipped(store: DimStore, item: DimItem, stores: DimStore[]) {
  return (
    item.owner === store.id || (item.owner === 'vault' && spaceLeftForItem(store, item, stores) > 0)
  );
}

export function isValidGameLoadoutPlug(hash: number) {
  return hash && hash !== UNSET_PLUG_HASH;
}
