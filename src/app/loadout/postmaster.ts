import { t } from 'i18next';
import * as _ from 'lodash';
import { dimItemService } from '../inventory/dimItemService.factory';
import { StoreServiceType, DimStore } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import { toaster } from '../ngimport-more';

export async function makeRoomForPostmaster(
  store: DimStore,
  toaster,
  bucketsService: () => Promise<InventoryBuckets>
): Promise<void> {
  const buckets = await bucketsService();
  const postmasterItems: DimItem[] = _.flatMap(
    buckets.byCategory.Postmaster,
    (bucket: InventoryBucket) => store.buckets[bucket.id]
  );
  const postmasterItemCountsByType = _.countBy(postmasterItems, (i) => i.bucket.id);
  // If any category is full, we'll move enough aside
  const itemsToMove: DimItem[] = [];
  _.each(postmasterItemCountsByType, (count, bucket) => {
    if (count > 0 && store.buckets[bucket].length > 0) {
      const items: DimItem[] = store.buckets[bucket];
      const capacity = store.capacityForItem(items[0]);
      const numNeededToMove = Math.max(0, count + items.length - capacity);
      if (numNeededToMove > 0) {
        // We'll move the lowest-value item to the vault.
        const candidates = _.sortBy(items.filter((i) => !i.equipped && !i.notransfer), (i) => {
          let value: number = {
            Common: 0,
            Uncommon: 1,
            Rare: 2,
            Legendary: 3,
            Exotic: 4
          }[i.tier];
          // And low-stat
          if (i.primStat) {
            value += i.primStat.value / 1000;
          }
          return value;
        });
        itemsToMove.push(..._.take(candidates, numNeededToMove));
      }
    }
  });
  // TODO: it'd be nice if this were a loadout option
  try {
    await moveItemsToVault(store.getStoresService(), store, itemsToMove, dimItemService);
    toaster.pop(
      'success',
      t('Loadouts.MakeRoom'),
      t('Loadouts.MakeRoomDone', {
        count: postmasterItems.length,
        movedNum: itemsToMove.length,
        store: store.name,
        context: store.gender
      })
    );
  } catch (e) {
    toaster.pop('error', t('Loadouts.MakeRoom'), t('Loadouts.MakeRoomError', { error: e.message }));
    throw e;
  }
}

// D2 only
export function pullablePostmasterItems(store: DimStore) {
  return (store.buckets[215593132] || []).filter((i) => {
    // Can be pulled
    return (
      i.canPullFromPostmaster &&
      // Either has space, or is going to a bucket we can make room in
      (i.bucket.vaultBucket || store.spaceLeftForItem(i) > 0)
    );
  });
}

export function totalPostmasterItems(store: DimStore) {
  return (
    (store.buckets[215593132] && store.buckets[215593132].length) ||
    (store.buckets.BUCKET_RECOVERY && store.buckets.BUCKET_RECOVERY.length)
  );
}

// D2 only
export async function pullFromPostmaster(store: DimStore): Promise<void> {
  const items = pullablePostmasterItems(store);

  try {
    let succeeded = 0;
    for (const item of items) {
      try {
        await dimItemService.moveTo(item, store);
        succeeded++;
      } catch (e) {
        console.error(`Error pulling ${item.name} from postmaster`, e);
        if (e.code === 'no-space') {
          // TODO: This could fire 20 times.
          toaster.pop(
            'error',
            t('Loadouts.PullFromPostmasterPopupTitle'),
            t('Loadouts.PullFromPostmasterError', { error: e.message })
          );
        } else {
          throw e;
        }
      }
    }

    if (succeeded > 0) {
      toaster.pop(
        'success',
        t('Loadouts.PullFromPostmasterPopupTitle'),
        t('Loadouts.PullFromPostmasterDone', {
          count: succeeded,
          store: store.name,
          context: store.gender
        })
      );
    }
  } catch (e) {
    toaster.pop(
      'error',
      t('Loadouts.PullFromPostmasterPopupTitle'),
      t('Loadouts.PullFromPostmasterError', { error: e.message })
    );
    throw e;
  }
}

// cribbed from D1FarmingService, but modified
async function moveItemsToVault(
  storeService: StoreServiceType,
  store: DimStore,
  items: DimItem[],
  dimItemService
): Promise<void> {
  const reservations = {};
  // reserve space for all move-asides
  reservations[store.id] = _.countBy(items, (i) => i.type);

  for (const item of items) {
    // Move a single item. We reevaluate the vault each time in case things have changed.
    const vault = storeService.getVault();
    const vaultSpaceLeft = vault!.spaceLeftForItem(item);
    if (vaultSpaceLeft <= 1) {
      // If we're down to one space, try putting it on other characters
      const otherStores = storeService
        .getStores()
        .filter((store) => !store.isVault && store.id !== store.id);
      const otherStoresWithSpace = otherStores.filter((store) => store.spaceLeftForItem(item));

      if (otherStoresWithSpace.length) {
        await dimItemService.moveTo(
          item,
          otherStoresWithSpace[0],
          false,
          item.amount,
          items,
          reservations
        );
        continue;
      }
    }
    await dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
  }
}
