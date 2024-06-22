import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { makeFakeItem as makeFakeD1Item } from 'app/inventory/store/d1-item-factory';
import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import { emptyArray } from 'app/utils/empty';
import { warnLog } from 'app/utils/log';
import { plugFitsIntoSocket } from 'app/utils/socket-utils';
import { DimItem } from '../inventory/item-types';
import { LoadoutItem, ResolvedLoadoutItem } from '../loadout/loadout-types';
import { findItemForLoadout } from './loadout-utils';

let missingLoadoutItemId = 1;
/*
 * We don't save consumables in D2 loadouts, but we may omit ids in shared
 * loadouts (because they'll never match someone else's inventory). So instead,
 * pick an ID. The ID ought to be numeric, or it will fail when sent to the DIM
 * API.
 */
export function generateMissingLoadoutItemId() {
  return `${missingLoadoutItemId++}`;
}

/**
 * Turn the loadout's items into real DIM items. Any that don't exist in inventory anymore
 * are returned as warnitems.
 */
export function getItemsFromLoadoutItems(
  itemCreationContext: ItemCreationContext,
  loadoutItems: LoadoutItem[] | undefined,
  storeId: string | undefined,
  allItems: DimItem[],
  modsByBucket?: {
    [bucketHash: number]: number[] | undefined;
  },
  /** needs passing in if this is d1 mode */
  d1Defs?: D1ManifestDefinitions,
): [items: ResolvedLoadoutItem[], warnitems: ResolvedLoadoutItem[]] {
  if (!loadoutItems) {
    return [emptyArray(), emptyArray()];
  }

  const { defs, buckets } = itemCreationContext;
  const useTheseDefs = d1Defs ?? defs;
  const items: ResolvedLoadoutItem[] = [];
  const warnitems: ResolvedLoadoutItem[] = [];
  for (const loadoutItem of loadoutItems) {
    // TODO: filter down to the class type of the loadout
    const item = findItemForLoadout(useTheseDefs, allItems, storeId, loadoutItem);
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
      const overriddenItem = useTheseDefs.isDestiny2
        ? applySocketOverrides(itemCreationContext, item, overrides)
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
      const fakeItem = useTheseDefs.isDestiny2
        ? makeFakeItem(itemCreationContext, loadoutItem.hash)
        : makeFakeD1Item(useTheseDefs, buckets, loadoutItem.hash);
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
