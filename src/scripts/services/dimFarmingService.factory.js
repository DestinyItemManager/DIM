import angular from 'angular';
import _ from 'underscore';
import { sum } from '../util';

angular.module('dimApp')
  .factory('dimFarmingService', FarmingService);

/**
 * A service for "farming" items by moving them continuously off a character,
 * so that they don't go to the Postmaster.
 */
function FarmingService($rootScope,
                        $q,
                        dimItemService,
                        dimStoreService,
                        $interval,
                        toaster,
                        dimFeatureFlags,
                        dimSettingsService,
                        $translate,
                        dimBucketService) {
  let intervalId;
  let cancelReloadListener;
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

  const settings = dimSettingsService.farming;

  const outOfSpaceWarning = _.throttle((store) => {
    toaster.pop('info',
                $translate.instant('FarmingMode.OutOfRoomTitle'),
                $translate.instant('FarmingMode.OutOfRoom', { character: store.name }));
  }, 60000);

  return {
    active: false,
    store: null,
    itemsMoved: 0,
    movingItems: false,
    makingRoom: false,
    // Move all items on the selected character to the vault.
    moveItemsToVault: function(items, incrementCounter) {
      return dimBucketService.getBuckets().then((buckets) => {
        const reservations = {};
        if (settings.makeRoomForItems) {
          // reserve one space in the active character
          reservations[this.store.id] = {};
          makeRoomTypes.forEach((type) => {
            reservations[this.store.id][buckets.byId[type].type] = 1;
          });
        }

        return _.reduce(items, (promise, item) => {
          // Move a single item. We do this as a chain of promises so we can reevaluate the situation after each move.
          return promise
            .then(() => {
              const vault = dimStoreService.getVault();
              const vaultSpaceLeft = vault.spaceLeftForItem(item);
              if (vaultSpaceLeft <= 1) {
                // If we're down to one space, try putting it on other characters
                const otherStores = _.select(dimStoreService.getStores(),
                                             (store) => !store.isVault && store.id !== this.store.id);
                const otherStoresWithSpace = _.select(otherStores, (store) => store.spaceLeftForItem(item));

                if (otherStoresWithSpace.length) {
                  if (dimFeatureFlags.debugMoves) {
                    console.log("Farming initiated move:", item.amount, item.name, item.type, 'to', otherStoresWithSpace[0].name, 'from', dimStoreService.getStore(item.owner).name);
                  }
                  return dimItemService.moveTo(item, otherStoresWithSpace[0], false, item.amount, items, reservations);
                }
              }
              if (dimFeatureFlags.debugMoves) {
                console.log("Farming initiated move:", item.amount, item.name, item.type, 'to', vault.name, 'from', dimStoreService.getStore(item.owner).name);
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
        }, $q.resolve());
      });
    },
    farmItems: function() {
      const store = dimStoreService.getStore(this.store.id);
      const toMove = _.select(store.items, (i) => {
        return !i.notransfer && (
          i.isEngram() ||
          (i.equipment && i.type === 'Uncommon') ||
          glimmerHashes.has(i.hash));
      });

      if (toMove.length === 0) {
        return $q.resolve();
      }

      this.movingItems = true;
      return this.moveItemsToVault(toMove, true)
        .finally(() => {
          this.movingItems = false;
        });
    },
    // Ensure that there's one open space in each category that could
    // hold an item, so they don't go to the postmaster.
    makeRoomForItems: function() {
      const store = dimStoreService.getStore(this.store.id);

      // If any category is full, we'll move one aside
      const itemsToMove = [];
      makeRoomTypes.forEach((makeRoomType) => {
        const items = store.buckets[makeRoomType];
        if (items.length > 0 && items.length >= store.capacityForItem(items[0])) {
          // We'll move the lowest-value item to the vault.
          const itemToMove = _.min(_.select(items, { equipped: false, notransfer: false }), (i) => {
            var value = {
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
      return this.moveItemsToVault(itemsToMove, false)
        .finally(() => {
          this.makingRoom = false;
        });
    },
    start: function(store) {
      var self = this;
      function farm() {
        var consolidateHashes = [
          417308266, // three of coins
          211861343, // heavy ammo synth
          928169143, // special ammo synth
          2180254632 // primary ammo synth
        ];

        self.consolidate = _.compact(consolidateHashes.map(function(hash) {
          var ret = angular.copy(dimItemService.getItem({
            hash: hash
          }));
          if (ret) {
            ret.amount = sum(dimStoreService.getStores(), (s) => s.amountOfItem(ret));
          }
          return ret;
        }));

        self.farmItems().then(function() {
          if (settings.makeRoomForItems) {
            self.makeRoomForItems();
          }
        });
      }

      if (!this.active) {
        this.active = true;
        this.store = store;
        this.itemsMoved = 0;
        this.movingItems = false;
        this.makingRoom = false;

        // Whenever the store is reloaded, run the farming algo
        // That way folks can reload manually too
        cancelReloadListener = $rootScope.$on('dim-stores-updated', function() {
          // prevent some recursion...
          if (self.active && !self.movingItems && !self.makingRoom) {
            farm();
          }
        });
        intervalId = $interval(function() {
          // just start reloading stores more often
          dimStoreService.reloadStores();
        }, 60000);
        farm();
      }
    },
    stop: function() {
      if (intervalId) {
        $interval.cancel(intervalId);
      }
      if (cancelReloadListener) {
        cancelReloadListener();
      }
      this.active = false;
    }
  };
}

