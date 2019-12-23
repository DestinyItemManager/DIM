import _ from 'lodash';
import { getBuckets } from '../destiny2/d2-buckets';
import { DestinyAccount } from '../accounts/destiny-account';
import { settings } from '../settings/settings';
import { D2Store } from '../inventory/store-types';
import { D2Item } from '../inventory/item-types';
import { getTag } from '../inventory/dim-item-info';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { D2StoresService } from '../inventory/d2-stores';
import { refresh } from '../shell/refresh';
import { Subscription, from } from 'rxjs';
import rxStore from '../store/store';
import * as actions from './actions';
import { moveItemsToVault } from './farming.service';
import { filter, map, tap, exhaustMap } from 'rxjs/operators';
import reduxStore from '../store/store';

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

// Move all items that are not tagged or locked.
async function makeRoomForItems(store: D2Store, moveTokens: boolean) {
  const makeRoomBuckets = await getMakeRoomBuckets();
  const itemInfos = reduxStore.getState().inventory.itemInfos;

  console.log('Making room');

  const itemsToMove: D2Item[] = [];
  makeRoomBuckets.forEach((makeRoomBucket) => {
    const items = store.buckets[makeRoomBucket.id];

    const filteredItems = items.filter(
      (i) => !i.equipped && !i.notransfer && !i.locked && !getTag(i, itemInfos)
    );

    itemsToMove.push(...filteredItems);
  });

  if (moveTokens) {
    const filteredItems = store.items.filter(
      (i) => i.isDestiny2() && i.itemCategoryHashes.includes(2088636411) && !i.notransfer
    );
    itemsToMove.push(...filteredItems);
  }

  if (itemsToMove.length === 0) {
    return;
  }

  return moveItemsToVault(store, itemsToMove, makeRoomBuckets, D2StoresService);
}
