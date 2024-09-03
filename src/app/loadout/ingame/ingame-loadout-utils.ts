import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, createItemContextSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import { itemsByItemId } from 'app/loadout-drawer/loadout-utils';
import { convertInGameLoadoutPlugItemHashesToSocketOverrides } from 'app/loadout/loadout-type-converters';
import { InGameLoadout, ResolvedLoadoutItem, ResolvedLoadoutMod } from 'app/loadout/loadout-types';
import { filterMap } from 'app/utils/collections';
import { DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { UNSET_PLUG_HASH } from '../known-values';
import { getSubclassPlugHashes } from '../loadout-item-utils';

/**
 * Get all the real DimItems from in-game loadout items.
 */
export function getItemsFromInGameLoadout(
  itemCreationContext: ItemCreationContext,
  loadoutItems: DestinyLoadoutItemComponent[],
  allItems: DimItem[],
): ResolvedLoadoutItem[] {
  return filterMap(loadoutItems, (li) => {
    const realItem =
      li.itemInstanceId !== '0' ? itemsByItemId(allItems)[li.itemInstanceId] : undefined;
    if (!realItem) {
      // We just skip missing items entirely - we can't find anything about them
      return undefined;
    }
    const socketOverrides = convertInGameLoadoutPlugItemHashesToSocketOverrides(li.plugItemHashes);
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
  });
}

/**
 * Hook version of getItemsFromLoadouts
 */
export function useItemsFromInGameLoadout(loadout: InGameLoadout) {
  const allItems = useSelector(allItemsSelector);
  const itemCreationContext = useSelector(createItemContextSelector);
  return useMemo(
    () => getItemsFromInGameLoadout(itemCreationContext, loadout.items, allItems),
    [itemCreationContext, loadout.items, allItems],
  );
}

export const gameLoadoutCompatibleBuckets = [
  BucketHashes.Subclass,
  ...D2Categories.Weapons,
  ...D2Categories.Armor,
];

/**
 * Does this in-game loadout, meet the requirements of this DIM loadout:
 *
 * Does it include the items the DIM loadout would equip,
 * and represent a full application of the DIM loadout's required mods?
 */
export function implementsDimLoadout(
  inGameLoadout: InGameLoadout,
  dimResolvedLoadoutItems: ResolvedLoadoutItem[],
  resolvedMods: ResolvedLoadoutMod[],
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

  if (equippedDimItems.length < 4) {
    return false;
  }

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

  // Ensure that the dimsubclass abilities, aspect and fragments are accounted for
  // so that builds using the same subclass but different setups are identified.
  const dimSubclass = dimResolvedLoadoutItems.find(
    (rli) => rli.item.bucket.hash === BucketHashes.Subclass,
  );
  if (dimSubclass?.loadoutItem?.socketOverrides) {
    // This was checked as part of item matching.
    const inGameSubclass = inGameLoadout.items.find(
      (item) => item.itemInstanceId === dimSubclass.item.id,
    )!;

    const dimSubclassPlugs = getSubclassPlugHashes(dimSubclass);
    for (const { plugHash } of dimSubclassPlugs) {
      // We only check one direction as DIM subclasses can be partially complete by
      // design.
      if (!inGameSubclass.plugItemHashes.includes(plugHash)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * to be equipped via in-game loadouts, an item must be on the char already,
 * or in the vault, but with room in the character's pockets for a transfer.
 *
 * AUG 29 2023:
 * Bungie has reenabled in-game loadouts, but they cannot pull from the vault.
 * we temporarily only consider an item IGL-equippable if it's on the char in question.
 */
export function itemCouldBeEquipped(store: DimStore, item: DimItem, _stores: DimStore[]) {
  return (
    item.owner === store.id
    // || (item.owner === 'vault' && spaceLeftForItem(store, item, stores) > 0)
  );
}

function isValidGameLoadoutPlug(hash: number) {
  return hash && hash !== UNSET_PLUG_HASH;
}
