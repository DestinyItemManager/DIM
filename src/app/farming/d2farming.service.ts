import * as _ from 'underscore';
import { REP_TOKENS } from './rep-tokens';
import { getBuckets } from '../destiny2/d2-buckets.service';
import { IIntervalService, IQService, IRootScopeService } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { settings } from '../settings/settings';
import { MoveReservations, dimItemService } from '../inventory/dimItemService.factory';
import { D2Store } from '../inventory/store-types';
import { D2Item } from '../inventory/item-types';
import { InventoryBucket } from '../inventory/inventory-buckets';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { D2StoresService } from '../inventory/d2-stores.service';

/**
 * A service for "farming" items by moving them continuously off a character,
 * so that they don't go to the Postmaster.
 */
export function D2FarmingService(
  $rootScope: IRootScopeService,
  $q: IQService,
  $interval: IIntervalService,
  toaster,
  $i18next
) {
  'ngInject';

  let intervalId;
  let subscription;

  const outOfSpaceWarning = _.throttle((store) => {
    toaster.pop('info',
                $i18next.t('FarmingMode.OutOfRoomTitle'),
                $i18next.t('FarmingMode.OutOfRoom', { character: store.name }));
  }, 60000);

  function getMakeRoomBuckets() {
    return getBuckets().then((buckets) => {
      return Object.values(buckets.byHash).filter((b) => b.category === BucketCategory.Equippable && b.type);
    });
  }

  return {
    active: false,
    store: null,
    movingItems: false,
    makingRoom: false,

    // Ensure that there's one open space in each category that could
    // hold an item, so they don't go to the postmaster.
    async makeRoomForItems(store: D2Store) {
      const makeRoomBuckets = await getMakeRoomBuckets();

      // If any category is full, we'll move one aside
      let itemsToMove: D2Item[] = [];
      makeRoomBuckets.forEach((makeRoomBucket) => {
        const items = store.buckets[makeRoomBucket.id];
        if (items.length > 0 && items.length >= makeRoomBucket.capacity) {
          // We'll move the lowest-value item to the vault.
          const itemToMove = _.min(items.filter((i) => !i.equipped && !i.notransfer), (i) => {
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
            itemsToMove.push(itemToMove);
          }
        }
      });

      if (settings.farming.moveTokens) {
        itemsToMove = itemsToMove.concat(store.items.filter((i) => REP_TOKENS.has(i.hash)));
      }

      if (itemsToMove.length === 0) {
        return $q.resolve();
      }

      return moveItemsToVault(store, itemsToMove, makeRoomBuckets);
    },

    async farm(store: D2Store) {
      this.makingRoom = true;
      try {
        // Then make room for items
        await this.makeRoomForItems(store);
      } finally {
        this.makingRoom = false;
      }
    },

    start(account: DestinyAccount, storeId: string) {
      if (!this.active) {
        this.active = true;
        this.movingItems = false;
        this.makingRoom = false;

        // Whenever the store is reloaded, run the farming algo
        // That way folks can reload manually too
        subscription = D2StoresService.getStoresStream(account).subscribe((stores) => {
          // prevent some recursion...
          if (this.active && !this.movingItems && !this.makingRoom && stores) {
            const store = stores.find((s) => s.id === storeId);
            this.store = store;
            this.farm(store);
          }
        });

        intervalId = $interval(() => {
          // just start reloading stores more often
          $rootScope.$broadcast('dim-refresh');
        }, 60000);
      }
    },

    stop() {
      if (intervalId) {
        $interval.cancel(intervalId);
      }
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
      this.active = false;
      this.store = null;
    }
  };

  async function moveItemsToVault(store: D2Store, items: D2Item[], makeRoomBuckets: InventoryBucket[]) {
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
          const otherStores = D2StoresService.getStores().filter((s) => !s.isVault && s.id !== store.id);
          const otherStoresWithSpace = otherStores.filter((store) => store.spaceLeftForItem(item));

          if (otherStoresWithSpace.length) {
            if ($featureFlags.debugMoves) {
              console.log("Farming initiated move:", item.amount, item.name, item.type, 'to', otherStoresWithSpace[0].name, 'from', D2StoresService.getStore(item.owner)!.name);
            }
            await dimItemService.moveTo(item, otherStoresWithSpace[0], false, item.amount, items, reservations);
            continue;
          }
        }
        if ($featureFlags.debugMoves) {
          console.log("Farming initiated move:", item.amount, item.name, item.type, 'to', vault.name, 'from', D2StoresService.getStore(item.owner)!.name);
        }
        await dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
      } catch (e) {
        if (e.code === 'no-space') {
          outOfSpaceWarning(store);
        } else {
          toaster.pop('error', item.name, e.message);
        }
        throw e;
      }
    }
  }
}
