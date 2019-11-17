import { settings } from '../settings/settings';
import _ from 'lodash';
import { MoveReservations } from '../inventory/item-move-service';
import { D1Item, DimItem } from '../inventory/item-types';
import { D1StoresService } from '../inventory/d1-stores';
import { DestinyAccount } from '../accounts/destiny-account';
import { getBuckets } from '../destiny1/d1-buckets';
import { refresh } from '../shell/refresh';
import { D1Store, StoreServiceType, DimStore } from '../inventory/store-types';
import * as actions from './actions';
import rxStore from '../store/store';
import { InventoryBucket } from '../inventory/inventory-buckets';
import { clearItemsOffCharacter } from '../loadout/loadout-apply';
import { Subscription, from } from 'rxjs';
import { filter, tap, map, exhaustMap } from 'rxjs/operators';

const glimmerHashes = new Set([
  269776572, // -house-banners
  3632619276, // -silken-codex
  2904517731, // -axiomatic-beads
  1932910919 // -network-keys
]);

// These are things you may pick up frequently out in the wild
const makeRoomTypes = [
  'BUCKET_PRIMARY_WEAPON',
  'BUCKET_SPECIAL_WEAPON',
  'BUCKET_HEAVY_WEAPON',
  'BUCKET_HEAD',
  'BUCKET_ARMS',
  'BUCKET_CHEST',
  'BUCKET_LEGS',
  'BUCKET_CLASS_ITEMS',
  'BUCKET_ARTIFACT',
  'BUCKET_GHOST',
  'BUCKET_CONSUMABLES',
  'BUCKET_MATERIALS'
];

/**
 * A service for "farming" items by moving them continuously off a character,
 * so that they don't go to the Postmaster.
 */
class D1Farming {
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
    this.subscription = D1StoresService.getStoresStream(account)
      .pipe(
        filter(() => this.promises.size === 0),
        filter<D1Store[]>(Boolean),
        map((stores) => {
          const store = stores.find((s) => s.id === storeId);

          if (!store) {
            this.stop();
          }
          return store;
        }),
        filter<D1Store>(Boolean),
        tap((store) => rxStore.dispatch(actions.start(store.id))),
        exhaustMap((store) => from(farm(store)))
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

export const D1FarmingService = new D1Farming();

async function farm(store: D1Store) {
  await farmItems(store);
  if (settings.farming.makeRoomForItems) {
    await makeRoomForItems(store);
  }
}

async function farmItems(store: D1Store) {
  const toMove = store.items.filter(
    (i) =>
      !i.notransfer &&
      (i.isEngram || (i.equipment && i.type === 'Uncommon') || glimmerHashes.has(i.hash))
  );

  if (toMove.length === 0) {
    return;
  }

  return moveItemsToVault(store, toMove, [], D1StoresService);
}

// Ensure that there's one open space in each category that could
// hold an item, so they don't go to the postmaster.
async function makeRoomForItems(store: D1Store) {
  // If any category is full, we'll move one aside
  const itemsToMove: D1Item[] = [];
  makeRoomTypes.forEach((makeRoomType) => {
    const items = store.buckets[makeRoomType];
    if (items.length > 0 && items.length >= store.capacityForItem(items[0])) {
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
      if (!_.isNumber(itemToMove)) {
        itemsToMove.push(itemToMove!);
      }
    }
  });

  if (itemsToMove.length === 0) {
    return;
  }

  const buckets = await getBuckets();
  const makeRoomBuckets = makeRoomTypes.map((type) => buckets.byId[type]);
  return moveItemsToVault(store, itemsToMove, makeRoomBuckets, D1StoresService);
}

export async function moveItemsToVault(
  store: DimStore,
  items: DimItem[],
  makeRoomBuckets: InventoryBucket[],
  storesService: StoreServiceType
) {
  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};
  makeRoomBuckets.forEach((bucket) => {
    reservations[store.id][bucket.type!] = 1;
  });

  return clearItemsOffCharacter(store, items, reservations, storesService);
}
