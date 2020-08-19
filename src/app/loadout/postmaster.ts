import { t } from 'app/i18next-t';
import _ from 'lodash';
import { dimItemService, ItemServiceType, MoveReservations } from '../inventory/item-move-service';
import { DimStore } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import { showNotification } from '../notifications/notifications';
import { postmasterNotification } from 'app/inventory/MoveNotifications';
import { getVault } from 'app/inventory/stores-helpers';

export async function makeRoomForPostmaster(
  store: DimStore,
  buckets: InventoryBuckets
): Promise<void> {
  const postmasterItems: DimItem[] = buckets.byCategory.Postmaster.flatMap(
    (bucket: InventoryBucket) => store.buckets[bucket.hash]
  );
  const postmasterItemCountsByType = _.countBy(postmasterItems, (i) => i.bucket.hash);
  // If any category is full, we'll move enough aside
  const itemsToMove: DimItem[] = [];
  _.forIn(postmasterItemCountsByType, (count, bucket) => {
    if (count > 0 && store.buckets[bucket].length > 0) {
      const items: DimItem[] = store.buckets[bucket];
      const capacity = store.capacityForItem(items[0]);
      const numNeededToMove = Math.max(0, count + items.length - capacity);
      if (numNeededToMove > 0) {
        // We'll move the lowest-value item to the vault.
        const candidates = _.sortBy(
          items.filter((i) => !i.equipped && !i.notransfer),
          (i) => {
            let value: number = {
              Common: 0,
              Uncommon: 1,
              Rare: 2,
              Legendary: 3,
              Exotic: 4,
            }[i.tier];
            // And low-stat
            if (i.primStat) {
              value += i.primStat.value / 1000;
            }
            return value;
          }
        );
        itemsToMove.push(..._.take(candidates, numNeededToMove));
      }
    }
  });
  // TODO: it'd be nice if this were a loadout option
  try {
    await moveItemsToVault(
      store.getStoresService().getStores(),
      store,
      itemsToMove,
      dimItemService
    );
    showNotification({
      type: 'success',
      // t('Loadouts.MakeRoomDone_male')
      // t('Loadouts.MakeRoomDone_female')
      // t('Loadouts.MakeRoomDone_male_plural')
      // t('Loadouts.MakeRoomDone_female_plural')
      title: t('Loadouts.MakeRoom'),
      body: t('Loadouts.MakeRoomDone', {
        count: postmasterItems.length,
        movedNum: itemsToMove.length,
        store: store.name,
        context: store.genderName,
      }),
    });
  } catch (e) {
    showNotification({
      type: 'error',
      title: t('Loadouts.MakeRoom'),
      body: t('Loadouts.MakeRoomError', { error: e.message }),
    });
    throw e;
  }
}

// D2 only
export function pullablePostmasterItems(store: DimStore) {
  return (store.buckets[215593132] || []).filter(
    (i) =>
      // Can be pulled
      i.canPullFromPostmaster &&
      // Either has space, or is going to a bucket we can make room in
      ((i.bucket.vaultBucket && !i.notransfer) || store.spaceLeftForItem(i) > 0)
  );
}

// We should load this from the manifest but it's hard to get it in here
export const POSTMASTER_SIZE = 21;

export function postmasterAlmostFull(store: DimStore) {
  return postmasterSpaceLeft(store) < 4;
}

export function postmasterSpaceLeft(store: DimStore) {
  return Math.max(0, POSTMASTER_SIZE - totalPostmasterItems(store));
}
export function postmasterSpaceUsed(store: DimStore) {
  return POSTMASTER_SIZE - postmasterSpaceLeft(store);
}

// to-do: either typing is wrong and this can return undefined, or this doesn't need &&s and ?.s
export function totalPostmasterItems(store: DimStore) {
  return store.buckets[215593132]?.length || 0;
}

const showNoSpaceError = _.throttle(
  (e: Error) =>
    showNotification({
      type: 'error',
      title: t('Loadouts.PullFromPostmasterPopupTitle'),
      body: t('Loadouts.PullFromPostmasterError', { error: e.message }),
    }),
  1000,
  { leading: true, trailing: false }
);

// D2 only
export async function pullFromPostmaster(store: DimStore): Promise<void> {
  const items = pullablePostmasterItems(store);

  // Only show one popup per message
  const errorNotification = _.memoize((message: string) => {
    showNotification({
      type: 'error',
      title: t('Loadouts.PullFromPostmasterPopupTitle'),
      body: t('Loadouts.PullFromPostmasterError', { error: message }),
    });
  });

  const promise = (async () => {
    let succeeded = 0;

    for (const item of items) {
      let amount = item.amount;
      if (item.uniqueStack) {
        const spaceLeft = store.spaceLeftForItem(item);
        if (spaceLeft > 0) {
          // Only transfer enough to top off the stack
          amount = Math.min(item.amount || 1, spaceLeft);
        }
        // otherwise try the move anyway - it may be that you don't have any but your bucket
        // is full, so it'll move aside something else (or the stack itself can be moved into
        // the vault). Otherwise it'll fail in moveTo.
      }

      try {
        await dimItemService.moveTo(item, store, false, amount);
        succeeded++;
      } catch (e) {
        // TODO: collect errors
        console.error(`Error pulling ${item.name} from postmaster`, e);
        if (e.code === 'no-space') {
          showNoSpaceError(e);
        } else {
          errorNotification(e.message);
        }
      }
    }
    return succeeded;
  })();

  showNotification(postmasterNotification(items.length, store, promise));

  await promise;
}

// cribbed from D1FarmingService, but modified
async function moveItemsToVault(
  stores: DimStore[],
  store: DimStore,
  items: DimItem[],
  dimItemService: ItemServiceType
): Promise<void> {
  const reservations: MoveReservations = {};
  // reserve space for all move-asides
  reservations[store.id] = _.countBy(items, (i) => i.type);

  for (const item of items) {
    // Move a single item. We reevaluate the vault each time in case things have changed.
    const vault = getVault(stores)!;
    const vaultSpaceLeft = vault.spaceLeftForItem(item);
    if (vaultSpaceLeft <= 1) {
      // If we're down to one space, try putting it on other characters
      const otherStores = stores.filter((store) => !store.isVault && store.id !== store.id);
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
