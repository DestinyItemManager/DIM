(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimFarmingService', FarmingService);

  FarmingService.$inject = ['$rootScope', '$q', 'dimItemService', 'dimStoreService', '$interval', 'dimCategory', 'toaster', 'dimBucketService', 'dimSettingsService'];

  /**
   * A service for "farming" items by moving them continuously off a character,
   * so that they don't go to the Postmaster.
   */
  function FarmingService($rootScope, $q, dimItemService, dimStoreService, $interval, dimCategory, toaster, dimBucketService, dimSettingsService) {
    var intervalId;
    var cancelReloadListener;
    var glimmerHashes = [
      269776572, // -house-banners
      3632619276, // -silken-codex
      2904517731, // -axiomatic-beads
      1932910919 // -network-keys
    ];
    return {
      active: false,
      store: null,
      itemsMoved: 0,
      movingItems: false,
      makingRoom: false,
      // Move all items on the selected character to the vault.
      moveItemsToVault: function(items, incrementCounter) {
        var self = this;
        var nospace = "No space left!";
        return dimBucketService
          .then(function(buckets) {
            return _.reduce(items, function(promise, item) {
              return promise
                .then(function() {
                  var vault = dimStoreService.getVault();
                  var vaultSpaceLeft = vault.spaceLeftForItem(item);
                  if (vaultSpaceLeft <= 1) {
                    var otherStores;
                    if (!dimSettingsService.farming.pushToVaultOnly) {
                      // If we're down to one space, try putting it on other characters
                      otherStores = _.select(dimStoreService.getStores(), function(store) {
                        return !store.isVault && store.id !== self.store.id;
                      });
                    }

                    var otherStoresWithSpace = _.select(otherStores, function(store) {
                      return store.spaceLeftForItem(item) > 0;
                    });
                    if (otherStoresWithSpace.length) {
                      return dimItemService.moveTo(item, otherStoresWithSpace[0], false, item.amount, items);
                    } else if (vaultSpaceLeft === 0) {
                      // If there's no room on other characters to move out of the vault,
                      // give up entirely.
                      if (!_.any(otherStores, function(store) {
                        return _.any(dimCategory[item.bucket.sort], function(category) {
                          return store.spaceLeftForItem({ type: category, location: buckets.byType[category], bucket: buckets.byType[category] }) > 0;
                        });
                      })) {
                        return $q.reject(new Error(nospace));
                      }
                    }
                  }
                  return dimItemService.moveTo(item, vault, false, item.amount, items);
                })
                .then(function() {
                  if (incrementCounter) {
                    self.itemsMoved++;
                  }
                })
                .catch(function(e) {
                  // No need to whine about being out of space
                  if (e.message !== nospace) {
                    toaster.pop('error', item.name, e.message);
                  }
                });
            }, $q.resolve());
          });
      },
      farmItems: function() {
        var self = this;
        var store = dimStoreService.getStore(self.store.id);
        var toMove = _.select(store.items, function(i) {
          return !i.location.inPostmaster && (
            (dimSettingsService.farming.engrams && i.isEngram()) ||
            (dimSettingsService.farming.glimmer && glimmerHashes.includes(i.hash)));
        });

        if (toMove.length === 0) {
          return $q.resolve();
        }

        self.movingItems = true;
        return self.moveItemsToVault(toMove, true)
          .finally(function() {
            self.movingItems = false;
          });
      },
      // Ensure that there's one open space in each category that could
      // hold an engram, so they don't go to the postmaster.
      makeRoomForItems: function() {
        var self = this;

        var store = dimStoreService.getStore(self.store.id);
        // TODO: this'll be easier with buckets
        // These types can have engrams
        var engramTypes = ['Primary',
                          'Special',
                          'Heavy',
                          'Helmet',
                          'Gauntlets',
                          'Chest',
                          'Leg',
                          'ClassItem',
                          'Consumables',
                          'Materials'];

        var applicableItems = _.select(store.items, function(i) {
          return !i.equipped &&
            !i.location.inPostmaster &&
            _.contains(engramTypes, i.type);
        });
        var itemsByType = _.groupBy(applicableItems, 'type');

        // If any category is full, we'll move one aside
        var itemsToMove = [];
        _.each(itemsByType, function(items) {
          // subtract 1 from capacity because we excluded the equipped item
          if (items.length > 0 && items.length >= (store.capacityForItem(items[0]) - 1)) {
            // We'll move the lowest-value item to the vault.
            itemsToMove.push(_.min(_.select(items, { notransfer: false }), function(i) {
              var value = {
                Common: 0,
                Uncommon: dimSettingsService.farming.moveGreens ? 1 : 9, // Move greens last since we mostly just want to dismantle those
                Rare: 2,
                Legendary: 3,
                Exotic: 4
              }[i.tier];
              // And low-stat
              if (i.primStat) {
                value += i.primStat.value / 1000.0;
              }
              return value;
            }));
          }
        });

        if (itemsToMove.length === 0) {
          return $q.resolve();
        }

        self.makingRoom = true;
        return self.moveItemsToVault(itemsToMove, false)
          .finally(function() {
            self.makingRoom = false;
          });
      },
      start: function(store) {
        var self = this;
        function farm() {
          var consolidateHashes = [
            417308266, // three of coins
            211861343, // heavy ammo synth
            937555249, // motes of light
            1738186005, // motes of light
//            1542293174, // armor materials
//            1898539128, // weapon parts
          ];

          self.consolidate = consolidateHashes.map(function(hash) {
            var ret = angular.copy(dimItemService.getItem({
              hash: hash
            }));
            ret.amount = 0;
            dimStoreService.getStores().forEach(function(s) {
              ret.amount += s.amountOfItem(ret);
            });
            return ret;
          });

          self.farmItems().then(function() {
            self.makeRoomForItems();
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
})();
