import _ from 'lodash';
import { getBuckets } from '../destiny2/d2-buckets';
import { DestinyAccount } from '../accounts/destiny-account';
import { settings } from '../settings/settings';
import { D2Store } from '../inventory/store-types';
import { D2Item } from '../inventory/item-types';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { D2StoresService } from '../inventory/d2-stores';
import { refresh } from '../shell/refresh';
import { Subscription, from } from 'rxjs';
import rxStore from '../store/store';
import * as actions from './actions';
import { moveItemsToVault } from './farming.service';
import { filter, map, tap, exhaustMap } from 'rxjs/operators';

function getMakeRoomBuckets() {
  return getBuckets().then((buckets) =>
    Object.values(buckets.byHash).filter((b) => b.category === BucketCategory.Equippable && b.type)
  );
}

/**
 * A service for "farming" items by moving them continuously off a character,
 * so that they don't go to the Postmaster.
 */
class D2Farming {
  private subscription?: Subscription;
  private intervalId?: number;
  private promises: Set<Promise<void>>;

  start = (account: DestinyAccount, storeId: string) => {
    if (this.subscription || this.intervalId) {
      this.stop();
    }

    this.promises = new Set();

    // Whenever the store is reloaded, run the farming algo
    // That way folks can reload manually too
    this.subscription = D2StoresService.getStoresStream(account)
      .pipe(
        filter(() => this.promises.size === 0),
        filter(Boolean),
        map((stores: D2Store[]) => {
          const store = stores.find((s) => s.id === storeId);
          if (!store) {
            this.stop();
          }
          return store;
        }),
        filter(Boolean),
        tap((store: D2Store) => rxStore.dispatch(actions.start(store.id))),
        exhaustMap((store: D2Store) => from(makeRoomForItems(store, settings.farming.moveTokens)))
      )
      .subscribe();
    this.subscription.add(() => rxStore.dispatch(actions.stop()));

    console.log('Started farming', storeId);

    this.intervalId = window.setInterval(refresh, 10000);
  };

  stop = () => {
    console.log('Stop farming');
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  };

  interrupt = (action: () => Promise<void>) => {
    if (!this.subscription) {
      return action();
    }
    clearInterval(this.intervalId);
    this.promises.add(action());
    const promiseCount = this.promises.size;
    console.log('Paused farming to perform an action');
    return Promise.all(this.promises).then(() => {
      if (promiseCount === this.promises.size) {
        console.log('Unpause farming');
        this.promises.clear();
        this.intervalId = window.setInterval(refresh, 10000);
      }
    });
  };
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
      const itemToMove = _.minBy(
        items.filter((i) => !i.equipped && !i.notransfer),
        (i) => {
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
        }
      );
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

  return moveItemsToVault(store, itemsToMove, makeRoomBuckets, D2StoresService);
}
