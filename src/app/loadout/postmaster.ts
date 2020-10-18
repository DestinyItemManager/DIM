import { t } from 'app/i18next-t';
import { postmasterNotification } from 'app/inventory/MoveNotifications';
import { storesSelector } from 'app/inventory/selectors';
import {
  capacityForItem,
  findItemsByBucket,
  getVault,
  spaceLeftForItem,
} from 'app/inventory/stores-helpers';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { moveItemTo, MoveReservations } from '../inventory/item-move-service';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { showNotification } from '../notifications/notifications';

export function makeRoomForPostmaster(store: DimStore, buckets: InventoryBuckets): ThunkResult {
  return async (dispatch) => {
    const postmasterItems: DimItem[] = buckets.byCategory.Postmaster.flatMap((bucket) =>
      findItemsByBucket(store, bucket.hash)
    );
    const postmasterItemCountsByType = _.countBy(postmasterItems, (i) => i.bucket.hash);
    // If any category is full, we'll move enough aside
    const itemsToMove: DimItem[] = [];
    _.forIn(postmasterItemCountsByType, (count, bucket) => {
      const bucketHash = parseInt(bucket, 10);
      if (count > 0 && findItemsByBucket(store, bucketHash).length > 0) {
        const items: DimItem[] = findItemsByBucket(store, bucketHash);
        const capacity = capacityForItem(store, items[0]);
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
    try {
      await dispatch(moveItemsToVault(store, itemsToMove));
      showNotification({
        type: 'success',
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
  };
}

// D2 only
export function pullablePostmasterItems(store: DimStore, stores: DimStore[]) {
  return (findItemsByBucket(store, BucketHashes.LostItems) || []).filter(
    (i) =>
      // Can be pulled
      i.canPullFromPostmaster &&
      // Either has space, or is going to a bucket we can make room in
      ((i.bucket.vaultBucket && !i.notransfer) || spaceLeftForItem(store, i, stores) > 0)
  );
}

// Only gets the equipment that can be pulled from postmaster, to be used in farming mode
export function pullablePostmasterEquipment(store: DimStore, stores: DimStore[]) {
  return (findItemsByBucket(store, BucketHashes.LostItems) || []).filter(
    (i) =>
      // Is equipment that can be pulled
      i.equipment &&
      i.canPullFromPostmaster &&
      // Either has space, or is going to a bucket we can make room in
      ((i.bucket.vaultBucket && !i.notransfer) || spaceLeftForItem(store, i, stores) > 0)
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
  return findItemsByBucket(store, BucketHashes.LostItems).length;
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
export function pullFromPostmaster(store: DimStore): ThunkResult {
  return pullItemsFromPostmaster(store, pullablePostmasterItems);
}

/*
 * Function to be used for pulling equipment from postmaster while farming
 */
export function pullEquipmentFromPostmaster(store: DimStore): ThunkResult {
  return pullItemsFromPostmaster(store, pullablePostmasterEquipment);
}

export function pullItemsFromPostmaster(
  store: DimStore,
  getItems: (store: DimStore, stores: DimStore[]) => DimItem[]
): ThunkResult {
  return async (dispatch, getState) => {
    const stores = storesSelector(getState());
    const items = getItems(store, stores);

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
          const spaceLeft = spaceLeftForItem(store, item, storesSelector(getState()));
          if (spaceLeft > 0) {
            // Only transfer enough to top off the stack
            amount = Math.min(item.amount || 1, spaceLeft);
          }
          // otherwise try the move anyway - it may be that you don't have any but your bucket
          // is full, so it'll move aside something else (or the stack itself can be moved into
          // the vault). Otherwise it'll fail in moveTo.
        }

        try {
          await dispatch(moveItemTo(item, store, false, amount));
          succeeded++;
        } catch (e) {
          // TODO: collect errors
          errorLog('postmaster', `Error pulling ${item.name} from postmaster`, e);
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
  };
}

// cribbed from D1FarmingService, but modified
function moveItemsToVault(store: DimStore, items: DimItem[]): ThunkResult {
  return async (dispatch, getState) => {
    const reservations: MoveReservations = {};
    // reserve space for all move-asides
    reservations[store.id] = _.countBy(items, (i) => i.type);

    for (const item of items) {
      const stores = storesSelector(getState());
      // Move a single item. We reevaluate the vault each time in case things have changed.
      const vault = getVault(stores)!;
      const vaultSpaceLeft = spaceLeftForItem(vault, item, stores);
      if (vaultSpaceLeft <= 1) {
        // If we're down to one space, try putting it on other characters
        const otherStores = stores.filter((store) => !store.isVault && store.id !== store.id);
        const otherStoresWithSpace = otherStores.filter((store) =>
          spaceLeftForItem(store, item, stores)
        );

        if (otherStoresWithSpace.length) {
          await dispatch(
            moveItemTo(item, otherStoresWithSpace[0], false, item.amount, items, reservations)
          );
          continue;
        }
      }
      await dispatch(moveItemTo(item, vault, false, item.amount, items, reservations));
    }
  };
}
