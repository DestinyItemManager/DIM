import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import { emptyArray } from 'app/utils/empty';
import { plugFitsIntoSocket } from 'app/utils/socket-utils';
import { LoadoutItem, ResolvedLoadoutItem } from './loadout-types';
import { findItemForLoadout } from './loadout-utils';

/**
 * Turn the loadout's items into real DIM items. Any that don't exist in inventory anymore
 * are returned as warnitems.
 */
export function getItemsFromLoadoutItems(
  loadoutItems: LoadoutItem[] | undefined,
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  storeId: string | undefined,
  buckets: InventoryBuckets,
  allItems: DimItem[],
  modsByBucket?: {
    [bucketHash: number]: number[] | undefined;
  }
): [items: ResolvedLoadoutItem[], warnitems: ResolvedLoadoutItem[]] {
  if (!loadoutItems) {
    return [emptyArray(), emptyArray()];
  }

  const items: ResolvedLoadoutItem[] = [];
  const warnitems: ResolvedLoadoutItem[] = [];
  for (const loadoutItem of loadoutItems) {
    // TODO: filter down to the class type of the loadout
    const item = findItemForLoadout(defs, allItems, storeId, loadoutItem);
    if (item) {
      // If there are any mods for this item's bucket, and the item is equipped, add them to socket overrides
      const modsForBucket =
        loadoutItem.equip && modsByBucket ? modsByBucket[item.bucket.hash] ?? [] : [];

      let overrides = loadoutItem.socketOverrides;

      for (const modHash of modsForBucket) {
        const socket = item.sockets?.allSockets.find((s) => plugFitsIntoSocket(s, modHash));
        if (socket) {
          overrides = { ...overrides, [socket?.socketIndex]: modHash };
        }
      }

      // Apply socket overrides so the item appears as it should be configured in the loadout
      const overriddenItem = defs.isDestiny2() ? applySocketOverrides(defs, item, overrides) : item;

      items.push({
        item: overriddenItem,
        // TODO: Should we keep the original socket overrides here, somewhere? There's a difference between "effective socket overrides" and "socket overrides to save"
        loadoutItem:
          overrides === loadoutItem.socketOverrides
            ? loadoutItem
            : { ...loadoutItem, socketOverrides: overrides },
      });
    } else {
      const itemDef = defs.InventoryItem.get(loadoutItem.hash);
      if (itemDef) {
        const fakeItem: DimItem =
          (defs.isDestiny2() && makeFakeItem(defs, buckets, undefined, loadoutItem.hash)) ||
          // TODO: would be great to have a D1 version of makeFakeItem
          ({
            id: loadoutItem.id,
            hash: loadoutItem.hash,
            icon: itemDef.displayProperties?.icon || itemDef.icon,
            name: itemDef.displayProperties?.name || itemDef.itemName,
          } as DimItem);
        fakeItem.id = loadoutItem.id;
        warnitems.push({ item: fakeItem, loadoutItem, missing: true });
      }
    }
  }

  return [items, warnitems];
}
