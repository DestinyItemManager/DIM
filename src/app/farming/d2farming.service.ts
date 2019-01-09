import * as _ from 'lodash';
import { getBuckets } from '../destiny2/d2-buckets.service';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { settings } from '../settings/settings';
import { MoveReservations, dimItemService } from '../inventory/dimItemService.factory';
import { D2Store } from '../inventory/store-types';
import { D2Item } from '../inventory/item-types';
import { InventoryBucket } from '../inventory/inventory-buckets';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { D2StoresService } from '../inventory/d2-stores.service';
import { toaster } from '../ngimport-more';
import { t } from 'i18next';
import { refresh } from '../shell/refresh';
import { Observable } from 'rxjs/Observable';
import '../rx-operators';
import { Subscription } from 'rxjs/Subscription';
import rxStore from '../store/store';
import * as actions from './actions';

const outOfSpaceWarning = _.throttle((store) => {
  toaster.pop(
    'info',
    t('FarmingMode.OutOfRoomTitle'),
    t('FarmingMode.OutOfRoom', { character: store.name })
  );
}, 60000);

function getMakeRoomBuckets() {
  return getBuckets().then((buckets) => {
    return Object.values(buckets.byHash).filter(
      (b) => b.category === BucketCategory.Equippable && b.type
    );
  });
}

/**
 * A service for "farming" items by moving them continuously off a character,
 * so that they don't go to the Postmaster.
 */
class D2Farming {
  private subscription?: Subscription;
  private intervalId?: number;

  start(account: DestinyAccount, storeId: string) {
    if (this.subscription || this.intervalId) {
      this.stop();
    }

    // Whenever the store is reloaded, run the farming algo
    // That way folks can reload manually too
    this.subscription = D2StoresService.getStoresStream(account)
      .filter(Boolean)
      .map((stores: D2Store[]) => {
        const store = stores.find((s) => s.id === storeId);

        console.log('Got store', store);
        if (!store) {
          this.stop();
        }
        return store;
      })
      .filter(Boolean)
      .do((store: D2Store) => rxStore.dispatch(actions.start(store.id)))
      .exhaustMap((store: D2Store) =>
        Observable.fromPromise(makeRoomForItems(store, settings.farming.moveTokens))
      )
      .subscribe();
    this.subscription.add(() => rxStore.dispatch(actions.stop()));

    console.log('Started farming', storeId);

    this.intervalId = window.setInterval(() => {
      // just start reloading stores more often
      refresh();
    }, 10000);
  }

  stop() {
    console.log('Stop farming');
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }
}

export const D2FarmingService = new D2Farming();

// Ensure that there's one open space in each category that could
// hold an item, so they don't go to the postmaster.
async function makeRoomForItems(store: D2Store, moveTokens: boolean) {
  const makeRoomBuckets = await getMakeRoomBuckets();

  console.log('Making room');

  // If any category is full, we'll move one aside
  let itemsToMove: D2Item[] = [];
  makeRoomBuckets.forEach((makeRoomBucket) => {
    const items = store.buckets[makeRoomBucket.id];
    if (items.length > 0 && items.length >= makeRoomBucket.capacity) {
      // We'll move the lowest-value item to the vault.
      const itemToMove = _.minBy(items.filter((i) => !i.equipped && !i.notransfer), (i) => {
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
      if (itemToMove) {
        itemsToMove.push(itemToMove);
      }
    }
  });

  if (moveTokens) {
    itemsToMove = itemsToMove.concat(
      store.items.filter(
        (i) => i.isDestiny2() && i.itemCategoryHashes.includes(2088636411) && !i.notransfer
      )
    );
  }

  if (itemsToMove.length === 0) {
    return;
  }

  return moveItemsToVault(store, itemsToMove, makeRoomBuckets);
}

async function moveItemsToVault(
  store: D2Store,
  items: D2Item[],
  makeRoomBuckets: InventoryBucket[]
) {
  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};
  makeRoomBuckets.forEach((bucket) => {
    reservations[store.id][bucket.type!] = 1;
  });

  for (const item of items) {
    try {
      // Move a single item. We reevaluate each time in case something changed.
      const vault = D2StoresService.getVault()!;
      const vaultSpaceLeft = vault.spaceLeftForItem(item);
      if (vaultSpaceLeft <= 1) {
        // If we're down to one space, try putting it on other characters
        const otherStores = D2StoresService.getStores().filter(
          (s) => !s.isVault && s.id !== store.id
        );
        const otherStoresWithSpace = otherStores.filter((store) => store.spaceLeftForItem(item));

        if (otherStoresWithSpace.length) {
          if ($featureFlags.debugMoves) {
            console.log(
              'Farming initiated move:',
              item.amount,
              item.name,
              item.type,
              'to',
              otherStoresWithSpace[0].name,
              'from',
              D2StoresService.getStore(item.owner)!.name
            );
          }
          await dimItemService.moveTo(
            item,
            otherStoresWithSpace[0],
            false,
            item.amount,
            items,
            reservations
          );
          continue;
        } else if (vaultSpaceLeft === 0) {
          outOfSpaceWarning(store);
          continue;
        }
      }
      if ($featureFlags.debugMoves) {
        console.log(
          'Farming initiated move:',
          item.amount,
          item.name,
          item.type,
          'to',
          vault.name,
          'from',
          D2StoresService.getStore(item.owner)!.name
        );
      }
      await dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
    } catch (e) {
      if (e.code === 'no-space') {
        outOfSpaceWarning(store);
      } else {
        toaster.pop('error', item.name, e.message);
      }
    }
  }
}
