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
import { LoadoutItem, ResolvedLoadoutItem } from './loadout-types';
import { findItemForLoadout } from './loadout-utils';

let missingLoadoutItemId = 1;
export function generateMissingLoadoutItemId() {
  return `loadoutitem-${missingLoadoutItemId++}`;
}

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
  customTotalStatsByClass: {
    [key: number]: number[];
  },
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
      const overriddenItem = defs.isDestiny2()
        ? applySocketOverrides(defs, item, customTotalStatsByClass, overrides)
        : item;

      items.push({
        item: overriddenItem,
        // TODO: Should we keep the original socket overrides here, somewhere? There's a difference between "effective socket overrides" and "socket overrides to save"
        loadoutItem:
          overrides === loadoutItem.socketOverrides
            ? loadoutItem
            : { ...loadoutItem, socketOverrides: overrides },
      });
    } else {
      const fakeItem: DimItem | null = defs.isDestiny2()
        ? makeFakeItem(defs, buckets, undefined, loadoutItem.hash, customTotalStatsByClass)
        : makeFakeD1Item(defs, buckets, loadoutItem.hash);
      if (fakeItem) {
        fakeItem.id = generateMissingLoadoutItemId();
        warnitems.push({ item: fakeItem, loadoutItem, missing: true });
      } else {
        warnLog('loadout', "Couldn't create fake warn item for", loadoutItem);
      }
    }
  }

  return [items, warnitems];
}
