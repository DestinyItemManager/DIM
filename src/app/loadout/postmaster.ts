import { t } from 'i18next';
import * as _ from 'underscore';
import { BucketsService, DimInventoryBucket } from '../destiny2/d2-buckets.service';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { flatMap } from '../util';

export function makeRoomForPostmaster(
  storeService: StoreServiceType,
  store: DimStore,
  dimItemService,
  toaster,
  bucketsService: BucketsService
) {
  bucketsService.getBuckets().then((buckets) => {
    const postmasterItems: DimItem[] = flatMap(buckets.byCategory.Postmaster,
                                    (bucket: DimInventoryBucket) => store.buckets[bucket.id]);
    const postmasterItemCountsByType = _.countBy(postmasterItems,
                                                (i) => i.bucket.id);

    // If any category is full, we'll move enough aside
    const itemsToMove: DimItem[] = [];
    _.each(postmasterItemCountsByType, (count, bucket) => {
      if (count > 0) {
        const items: DimItem[] = store.buckets[bucket];
        const capacity = store.capacityForItem(items[0]);
        const numNeededToMove = Math.max(0, count + items.length - capacity);
        if (numNeededToMove > 0) {
          // We'll move the lowest-value item to the vault.
          const candidates = _.sortBy(items.filter((i) => !i.equipped && !i.notransfer), (i) => {
            let value = {
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
          itemsToMove.push(..._.first(candidates, numNeededToMove));
        }
      }
    });

    // TODO: it'd be nice if this were a loadout option
    return moveItemsToVault(storeService, store, itemsToMove, dimItemService)
      .then(() => {
        toaster.pop('success',
                    t('Loadouts.MakeRoom'),
                    t('Loadouts.MakeRoomDone', { count: postmasterItems.length, movedNum: itemsToMove.length, store: store.name, context: store.gender }));
      })
      .catch((e) => {
        toaster.pop('error',
                    t('Loadouts.MakeRoom'),
                    t('Loadouts.MakeRoomError', { error: e.message }));
        throw e;
      });
  });
}

// D2 only
export function pullablePostmasterItems(store: DimStore) {
  return store.buckets[215593132].filter((i) => {
    // Can be pulled
    return i.canPullFromPostmaster &&
    // Either has space, or is going to a bucket we can make room in
    (i.bucket.vaultBucket || store.spaceLeftForItem(i) > 0);
  });
}

// D2 only
export async function pullFromPostmaster(store: DimStore, dimItemService, toaster): Promise<void> {
  const items = pullablePostmasterItems(store);

  try {
    let succeeded = 0;
    for (const item of items) {
      try {
        await dimItemService.moveTo(item, store);
        succeeded++;
      } catch (e) {
        console.log(e);
        if (e.code === 'no-space') {
          // TODO: This could fire 20 times.
          toaster.pop('error',
            t('Loadouts.PullFromPostmasterPopupTitle'),
            t('Loadouts.PullFromPostmasterError', { error: e.message }));
        } else {
          throw e;
        }
      }
    }

    if (succeeded > 0) {
      toaster.pop('success',
        t('Loadouts.PullFromPostmasterPopupTitle'),
        t('Loadouts.PullFromPostmasterDone', { count: succeeded, store: store.name, context: store.gender }));
    }
  } catch (e) {
    toaster.pop('error',
      t('Loadouts.PullFromPostmasterPopupTitle'),
      t('Loadouts.PullFromPostmasterError', { error: e.message }));
    throw e;
  }
}

// cribbed from dimFarmingService, but modified
async function moveItemsToVault(
  storeService: StoreServiceType,
  store: DimStore,
  items: DimItem[],
  dimItemService
): Promise<void> {
  const reservations = {};
  // reserve space for all move-asides
  reservations[store.id] = _.countBy(items, 'type');

  for (const item of items) {
    // Move a single item. We reevaluate the vault each time in case things have changed.
    const vault = storeService.getVault();
    const vaultSpaceLeft = vault!.spaceLeftForItem(item);
    if (vaultSpaceLeft <= 1) {
      // If we're down to one space, try putting it on other characters
      const otherStores = _.filter(storeService.getStores(),
                                    (store) => !store.isVault && store.id !== store.id);
      const otherStoresWithSpace = otherStores.filter((store) => store.spaceLeftForItem(item));

      if (otherStoresWithSpace.length) {
        await dimItemService.moveTo(item, otherStoresWithSpace[0], false, item.amount, items, reservations);
        continue;
      }
    }
    await dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
  }
}
