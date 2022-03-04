import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { makeFakeItem as makeFakeD1Item } from 'app/inventory/store/d1-item-factory';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import { emptyArray } from 'app/utils/empty';
import { warnLog } from 'app/utils/log';
import { plugFitsIntoSocket } from 'app/utils/socket-utils';
import { DimItem } from '../inventory/item-types';
import { DimLoadoutItem, LoadoutItem } from './loadout-types';
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
): [items: DimLoadoutItem[], warnitems: DimLoadoutItem[]] {
  if (!loadoutItems) {
    return [emptyArray(), emptyArray()];
  }

  const items: DimLoadoutItem[] = [];
  const warnitems: DimLoadoutItem[] = [];
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

      items.push({ ...overriddenItem, socketOverrides: overrides });
    } else {
      const fakeItem: DimLoadoutItem | null = defs.isDestiny2()
        ? makeFakeItem(defs, buckets, undefined, loadoutItem.hash)
        : makeFakeD1Item(defs, buckets, loadoutItem.hash);
      if (fakeItem) {
        fakeItem.equipped = loadoutItem.equip;
        fakeItem.socketOverrides = loadoutItem.socketOverrides;
        fakeItem.id = loadoutItem.id;
        warnitems.push(fakeItem);
      } else {
        warnLog('loadout', "Couldn't create fake warn item for", loadoutItem);
      }
    }
  }

  return [items, warnitems];
}
