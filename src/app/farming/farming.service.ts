import _ from 'lodash';
import { MoveReservations, sortMoveAsideCandidatesForStore } from '../inventory/item-move-service';
import { DimItem } from '../inventory/item-types';
import { D1StoresService } from '../inventory/d1-stores';
import { DestinyAccount } from '../accounts/destiny-account';
import { refresh } from '../shell/refresh';
import { D1Store, DimStore } from '../inventory/store-types';
import * as actions from './actions';
import rxStore from '../store/store';
import { InventoryBucket } from '../inventory/inventory-buckets';
import { clearItemsOffCharacter } from '../loadout/loadout-apply';
import { Subscription, from } from 'rxjs';
import { filter, tap, map, exhaustMap } from 'rxjs/operators';
import { settingsSelector } from 'app/settings/reducer';
import { itemInfosSelector, itemHashTagsSelector, bucketsSelector } from 'app/inventory/selectors';
import { getVault } from 'app/inventory/stores-helpers';

const glimmerHashes = new Set([
  269776572, // -house-banners
  3632619276, // -silken-codex
  2904517731, // -axiomatic-beads
  1932910919, // -network-keys
]);

// These are things you may pick up frequently out in the wild
const makeRoomTypes = [
  1498876634, // Primary
  2465295065, // Special
  953998645, // Heavy
  3448274439, // Helmet
  3551918588, // Gauntlets
  14239492, // Chest
  20886954, // Legs
  1585787867, // ClassItem
  434908299, // Artifact
  4023194814, // Ghost
  1469714392, // Consumable
  3865314626, // Material
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
  if (settingsSelector(rxStore.getState()).farmingMakeRoomForItems) {
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

  return moveItemsToVault(store.getStoresService().getStores(), store, toMove, []);
}

// Ensure that there's one open space in each category that could
// hold an item, so they don't go to the postmaster.
async function makeRoomForItems(store: D1Store) {
  const buckets = bucketsSelector(rxStore.getState())!;
  const makeRoomBuckets = makeRoomTypes.map((type) => buckets.byHash[type]);
  makeRoomForItemsInBuckets(store.getStoresService().getStores(), store, makeRoomBuckets);
}

// Ensure that there's one open space in each category that could
// hold an item, so they don't go to the postmaster.
export async function makeRoomForItemsInBuckets(
  stores: DimStore[],
  store: DimStore,
  makeRoomBuckets: InventoryBucket[]
) {
  // If any category is full, we'll move one aside
  const itemsToMove: DimItem[] = [];
  const itemInfos = itemInfosSelector(rxStore.getState());
  const itemHashTags = itemHashTagsSelector(rxStore.getState());
  makeRoomBuckets.forEach((bucket) => {
    const items = store.buckets[bucket.hash];
    if (items.length > 0 && items.length >= store.capacityForItem(items[0])) {
      const moveAsideCandidates = items.filter((i) => !i.equipped && !i.notransfer);
      const prioritizedMoveAsideCandidates = sortMoveAsideCandidatesForStore(
        moveAsideCandidates,
        store,
        getVault(stores)!,
        itemInfos,
        itemHashTags
      );
      // We'll move the first one to the vault
      const itemToMove = prioritizedMoveAsideCandidates[0];
      if (itemToMove) {
        itemsToMove.push(itemToMove);
      }
    }
  });

  if (itemsToMove.length === 0) {
    return;
  }

  return moveItemsToVault(stores, store, itemsToMove, makeRoomBuckets);
}

async function moveItemsToVault(
  stores: DimStore[],
  store: DimStore,
  items: DimItem[],
  makeRoomBuckets: InventoryBucket[]
) {
  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};
  makeRoomBuckets.forEach((bucket) => {
    reservations[store.id][bucket.type!] = 1;
  });

  return clearItemsOffCharacter(stores, store, items, reservations);
}
