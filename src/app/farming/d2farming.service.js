import _ from 'underscore';

/**
 * A service for "farming" items by moving them continuously off a character,
 * so that they don't go to the Postmaster.
 */
export function D2FarmingService($rootScope,
                        $q,
                        dimItemService,
                        D2StoresService,
                        $interval,
                        toaster,
                        $i18next,
                        D2BucketsService) {
  'ngInject';

  let intervalId;
  let cancelReloadListener;
  let subscription;

  const outOfSpaceWarning = _.throttle((store) => {
    toaster.pop('info',
                $i18next.t('FarmingMode.OutOfRoomTitle'),
                $i18next.t('FarmingMode.OutOfRoom', { character: store.name }));
  }, 60000);

  function getMakeRoomBuckets() {
    return D2BucketsService.getBuckets().then((buckets) => {
      const makeRoomBuckets = Object.values(buckets.byHash).filter((b) => b.category === 3 && b.type);
      console.log({ makeRoomBuckets });
      return makeRoomBuckets;
    });
  }

  return {
    active: false,
    store: null,
    itemsMoved: 0,
    movingItems: false,
    makingRoom: false,
    // Move all items on the selected character to the vault.
    moveItemsToVault: function(store, items, makeRoomBuckets) {
      const reservations = {};
      // reserve one space in the active character
      reservations[store.id] = {};
      makeRoomBuckets.forEach((bucket) => {
        reservations[store.id][bucket.type] = 1;
      });

      return _.reduce(items, (promise, item) => {
        // Move a single item. We do this as a chain of promises so we can reevaluate the situation after each move.
        return promise
          .then(() => {
            const vault = D2StoresService.getVault();
            const vaultSpaceLeft = vault.spaceLeftForItem(item);
            if (vaultSpaceLeft <= 1) {
              // If we're down to one space, try putting it on other characters
              const otherStores = _.select(D2StoresService.getStores(),
                                            (store) => !store.isVault && store.id !== store.id);
              const otherStoresWithSpace = _.select(otherStores, (store) => store.spaceLeftForItem(item));

              if (otherStoresWithSpace.length) {
                if ($featureFlags.debugMoves) {
                  console.log("Farming initiated move:", item.amount, item.name, item.type, 'to', otherStoresWithSpace[0].name, 'from', D2StoresService.getStore(item.owner).name);
                }
                return dimItemService.moveTo(item, otherStoresWithSpace[0], false, item.amount, items, reservations);
              }
            }
            if ($featureFlags.debugMoves) {
              console.log("Farming initiated move:", item.amount, item.name, item.type, 'to', vault.name, 'from', D2StoresService.getStore(item.owner).name);
            }
            return dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
          })
          .catch((e) => {
            if (e.code === 'no-space') {
              outOfSpaceWarning(store);
            } else {
              toaster.pop('error', item.name, e.message);
            }
            throw e;
          });
      }, $q.resolve());
    },
    // Ensure that there's one open space in each category that could
    // hold an item, so they don't go to the postmaster.
    makeRoomForItems: function(store) {
      return getMakeRoomBuckets().then((makeRoomBuckets) => {
        // If any category is full, we'll move one aside
        const itemsToMove = [];
        makeRoomBuckets.forEach((makeRoomBucket) => {
          const items = store.buckets[makeRoomBucket.id];
          if (items.length > 0 && items.length >= makeRoomBucket.capacity) {
            // We'll move the lowest-value item to the vault.
            const itemToMove = _.min(_.select(items, { equipped: false, notransfer: false }), (i) => {
              let value = {
                Common: 0,
                Uncommon: 1,
                Rare: 2,
                Legendary: 3,
                Exotic: 4
              }[i.tier];
              // And low-stat
              if (i.primStat) {
                value += i.primStat.value / 1000.0;
              }
              return value;
            });
            if (itemToMove !== Infinity) {
              itemsToMove.push(itemToMove);
            }
          }
        });

        if (itemsToMove.length === 0) {
          return $q.resolve();
        }

        this.makingRoom = true;
        return this.moveItemsToVault(store, itemsToMove, makeRoomBuckets)
          .finally(() => {
            this.makingRoom = false;
          });
      });
    },
    start: function(account, storeId) {
      if (!this.active) {
        this.active = true;
        this.itemsMoved = 0;
        this.movingItems = false;
        this.makingRoom = false;

        // Whenever the store is reloaded, run the farming algo
        // That way folks can reload manually too
        subscription = D2StoresService.getStoresStream(account).subscribe((stores) => {
          // prevent some recursion...
          if (this.active && !this.movingItems && !this.makingRoom) {
            const store = stores.find((s) => s.id === storeId);
            this.store = store;
            this.makeRoomForItems(store);
          }
        });

        intervalId = $interval(() => {
          // just start reloading stores more often
          $rootScope.$broadcast('dim-refresh');
        }, 60000);
      }
    },
    stop: function() {
      if (intervalId) {
        $interval.cancel(intervalId);
      }
      if (cancelReloadListener) {
        cancelReloadListener();
      }
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
      this.active = false;
      this.store = null;
    }
  };
}

