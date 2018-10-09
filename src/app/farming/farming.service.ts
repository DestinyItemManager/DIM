import copy from 'fast-copy';
import { settings } from '../settings/settings';
import * as _ from 'lodash';
import { MoveReservations, dimItemService } from '../inventory/dimItemService.factory';
import { D1Item, DimItem } from '../inventory/item-types';
import { D1StoresService } from '../inventory/d1-stores.service';
import { t } from 'i18next';
import { toaster } from '../ngimport-more';
import { $q, $interval } from 'ngimport';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getBuckets } from '../destiny1/d1-buckets.service';
import { refresh } from '../shell/refresh';

export const D1FarmingService = FarmingService();

/**
 * A service for "farming" items by moving them continuously off a character,
 * so that they don't go to the Postmaster.
 */
function FarmingService() {
  let intervalId;
  let subscription;
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

  return {
    active: false,
    store: null,
    itemsMoved: 0,
    movingItems: false,
    makingRoom: false,
    // Move all items on the selected character to the vault.
    moveItemsToVault(items: D1Item[], incrementCounter: boolean) {
      return getBuckets().then((buckets) => {
        const reservations: MoveReservations = {};
        if (settings.farming.makeRoomForItems) {
          // reserve one space in the active character
          reservations[this.store.id] = {};
          makeRoomTypes.forEach((type) => {
            reservations[this.store.id][buckets.byId[type].type!] = 1;
          });
        }

        return _.reduce(
          items,
          (promise, item) => {
            // Move a single item. We do this as a chain of promises so we can reevaluate the situation after each move.
            return promise
              .then(() => {
                const vault = D1StoresService.getVault()!;
                const vaultSpaceLeft = vault.spaceLeftForItem(item);
                if (vaultSpaceLeft <= 1) {
                  // If we're down to one space, try putting it on other characters
                  const otherStores = D1StoresService.getStores().filter(
                    (store) => !store.isVault && store.id !== this.store.id
                  );
                  const otherStoresWithSpace = otherStores.filter((store) =>
                    store.spaceLeftForItem(item)
                  );

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
                        D1StoresService.getStore(item.owner)!.name
                      );
                    }
                    return dimItemService.moveTo(
                      item,
                      otherStoresWithSpace[0],
                      false,
                      item.amount,
                      items,
                      reservations
                    );
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
                    D1StoresService.getStore(item.owner)!.name
                  );
                }
                return dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
              })
              .then(() => {
                if (incrementCounter) {
                  this.itemsMoved++;
                }
              })
              .catch((e) => {
                if (e.code === 'no-space') {
                  outOfSpaceWarning(this.store);
                } else {
                  toaster.pop('error', item.name, e.message);
                }
                throw e;
              });
          },
          $q.resolve()
        );
      });
    },
    farmItems() {
      const store = D1StoresService.getStore(this.store.id)!;
      const toMove = store.items.filter((i) => {
        return (
          !i.notransfer &&
          (i.isEngram || (i.equipment && i.type === 'Uncommon') || glimmerHashes.has(i.hash))
        );
      });

      if (toMove.length === 0) {
        return $q.resolve();
      }

      this.movingItems = true;
      return this.moveItemsToVault(toMove, true).finally(() => {
        this.movingItems = false;
      });
    },
    // Ensure that there's one open space in each category that could
    // hold an item, so they don't go to the postmaster.
    makeRoomForItems() {
      const store = D1StoresService.getStore(this.store.id)!;

      // If any category is full, we'll move one aside
      const itemsToMove: DimItem[] = [];
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
        return $q.resolve();
      }

      this.makingRoom = true;
      return this.moveItemsToVault(itemsToMove, false).finally(() => {
        this.makingRoom = false;
      });
    },
    start(account: DestinyAccount, storeId: string) {
      const farm = () => {
        const consolidateHashes = [
          417308266, // three of coins
          211861343, // heavy ammo synth
          928169143, // special ammo synth
          2180254632 // primary ammo synth
        ];

        this.consolidate = _.compact(
          consolidateHashes.map((hash) => {
            const ret = copy(
              D1StoresService.getItemAcrossStores({
                hash
              })
            );
            if (ret) {
              ret.amount = _.sumBy(D1StoresService.getStores(), (s) => s.amountOfItem(ret));
            }
            return ret;
          })
        );

        this.farmItems().then(() => {
          if (settings.farming.makeRoomForItems) {
            this.makeRoomForItems();
          }
        });
      };

      if (!this.active) {
        this.active = true;
        this.itemsMoved = 0;
        this.movingItems = false;
        this.makingRoom = false;

        // Whenever the store is reloaded, run the farming algo
        // That way folks can reload manually too
        subscription = D1StoresService.getStoresStream(account).subscribe((stores) => {
          // prevent some recursion...
          if (this.active && !this.movingItems && !this.makingRoom && stores) {
            const store = stores.find((s) => s.id === storeId);
            this.store = store;
            farm();
          }
        });

        intervalId = $interval(() => {
          // just start reloading stores more often
          refresh();
        }, 60000);
      }
    },
    stop() {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
      if (intervalId) {
        $interval.cancel(intervalId);
      }
      this.active = false;
    }
  };
}
