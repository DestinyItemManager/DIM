import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { spaceLeftForItem } from 'app/inventory/stores-helpers';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { potentialLoadoutItemsByItemId } from 'app/loadout-drawer/loadout-utils';
import { DestinyItemType, DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Get all the real DimItems from ingame loadout items.
 *
 * TODO: These aren't ResolvedLoadoutItems because we don't know how D2 will handle missing items yet.
 */
export function getItemsFromInGameLoadout(
  loadoutItems: DestinyLoadoutItemComponent[],
  allItems: DimItem[]
): DimItem[] {
  // TODO: apply socket overrides once we know what those are?
  return _.compact(
    loadoutItems.map((li) =>
      li.itemInstanceId !== '0'
        ? potentialLoadoutItemsByItemId(allItems)[li.itemInstanceId]
        : undefined
    )
  );
}

/**
 * Hook version of getItemsFromLoadouts
 */
export function useItemsFromInGameLoadout(loadout: InGameLoadout) {
  const allItems = useSelector(allItemsSelector);
  return useMemo(
    () => getItemsFromInGameLoadout(loadout.items, allItems),
    [loadout.items, allItems]
  );
}

/**
 * does this game loadout, meet the requirements of this DIM loadout:
 *
 * does it include the items the DIM loadout would equip,
 * and represent a full application of the DIM loadout's required mods?
 */
export function implementsDimLoadout(
  inGameLoadout: InGameLoadout,
  dimLoadout: Loadout,
  defs: D2ManifestDefinitions
) {
  const equippedDimItems = dimLoadout.items
    .filter((i) => {
      if (!i.equip) {
        return false;
      }
      const itemType = defs.InventoryItem.get(i.hash).itemType;
      // only checking the items that game loadouts support
      return (
        itemType === DestinyItemType.Weapon ||
        itemType === DestinyItemType.Armor ||
        itemType === DestinyItemType.Subclass
      );
    })
    .map((i) => i.id);
  const equippedGameItems = inGameLoadout.items.map((i) => i.itemInstanceId);

  // try the faster quit
  if (!equippedDimItems.every((i) => equippedGameItems.includes(i))) {
    return false;
  }

  const gameLoadoutMods = inGameLoadout.items
    .flatMap((i) => i.plugItemHashes)
    .filter(isValidGameLoadoutPlug);

  const dimLoadoutMods = [
    ...(dimLoadout.parameters?.mods ?? []),
    ...(dimLoadout.autoStatMods ?? []),
  ];
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
  // TO-DO: SHARE THIS VALUE ONCE 9306 IS MERGED
  return hash && hash !== 2166136261;
}
