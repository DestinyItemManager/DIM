import { settings } from '../settings/settings';
import * as _ from 'lodash';
import { MoveReservations, dimItemService } from '../inventory/dimItemService.factory';
import { D1Item, DimItem } from '../inventory/item-types';
import { D1StoresService } from '../inventory/d1-stores.service';
import { t } from 'i18next';
import { toaster } from '../ngimport-more';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getBuckets } from '../destiny1/d1-buckets.service';
import { refresh } from '../shell/refresh';
import { Subscription } from 'rxjs/Subscription';
import { D1Store, StoreServiceType, DimStore } from '../inventory/store-types';
import { Observable } from 'rxjs/Observable';
import * as actions from './actions';
import rxStore from '../store/store';
import { InventoryBucket } from '../inventory/inventory-buckets';

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

const outOfSpaceWarning = _.throttle((store) => {
  toaster.pop(
    'info',
    t('FarmingMode.OutOfRoomTitle'),
    t('FarmingMode.OutOfRoom', { character: store.name })
  );
}, 60000);

/**
 * A service for "farming" items by moving them continuously off a character,
 * so that they don't go to the Postmaster.
 */
class D1Farming {
  private subscription?: Subscription;
  private intervalId?: number;

  start = (account: DestinyAccount, storeId: string) => {
    if (this.subscription || this.intervalId) {
      this.stop();
    }

    // Whenever the store is reloaded, run the farming algo
    // That way folks can reload manually too
    this.subscription = D1StoresService.getStoresStream(account)
      .filter(Boolean)
      .map((stores: D1Store[]) => {
        const store = stores.find((s) => s.id === storeId);

        if (!store) {
          this.stop();
        }
        return store;
      })
      .filter(Boolean)
      .do((store: D1Store) => rxStore.dispatch(actions.start(store.id)))
      .exhaustMap((store: D1Store) => Observable.fromPromise(farm(store)))
      .subscribe();
    this.subscription.add(() => rxStore.dispatch(actions.stop()));

    console.log('Started farming', storeId);

    this.intervalId = window.setInterval(() => {
      // just start reloading stores more often
      refresh();
    }, 10000);
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

  for (const item of items) {
    try {
      // Move a single item. We reevaluate each time in case something changed.
      const vault = storesService.getVault()!;
      const vaultSpaceLeft = vault.spaceLeftForItem(item);
      if (vaultSpaceLeft <= 1) {
        // If we're down to one space, try putting it on other characters
        const otherStores = storesService
          .getStores()
          .filter((s) => !s.isVault && s.id !== store.id);
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
              storesService.getStore(item.owner)!.name
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
          storesService.getStore(item.owner)!.name
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
