(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimEngramFarmingService', EngramFarmingService);

  EngramFarmingService.$inject = ['$rootScope', '$q', 'dimItemService', 'dimStoreService', '$interval', 'dimCategory', 'toaster', 'dimBucketService'];

  /**
   * A service for "farming" engrams by moving them continuously off a character,
   * so that they don't go to the Postmaster.
   */
  function EngramFarmingService($rootScope, $q, dimItemService, dimStoreService, $interval, dimCategory, toaster, dimBucketService) {
    var intervalId;
    var cancelReloadListener;
    return {
      active: false,
      store: null,
      engramsMoved: 0,
      movingEngrams: false,
      makingRoom: false,
      // Move all engrams on the selected character to the vault.
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
                    // If we're down to one space, try putting it on other characters
                    var otherStores = _.select(dimStoreService.getStores(), function(store) {
                      return !store.isVault && store.id !== self.store.id;
                    });

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
                    self.engramsMoved++;
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
      moveEngramsToVault: function() {
        var self = this;
        var store = dimStoreService.getStore(self.store.id);
        var engrams = _.select(store.items, function(i) {
          return i.isEngram() && !i.location.inPostmaster;
        });

        if (engrams.length === 0) {
          return $q.resolve();
        }

        self.movingEngrams = true;
        return self.moveItemsToVault(engrams, true)
          .finally(function() {
            self.movingEngrams = false;
          });
      },
      // Ensure that there's one open space in each category that could
      // hold an engram, so they don't go to the postmaster.
      makeRoomForEngrams: function() {
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
                          'ClassItem'];

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
          self.moveEngramsToVault().then(function() {
            self.makeRoomForEngrams();
          });
        }

        if (!this.active) {
          this.active = true;
          this.store = store;
          this.engramsMoved = 0;
          this.movingEngrams = false;
          this.makingRoom = false;

          // Whenever the store is reloaded, run the farming algo
          // That way folks can reload manually too
          cancelReloadListener = $rootScope.$on('dim-stores-updated', function() {
            // prevent some recursion...
            if (self.active && !self.movingEngrams && !self.makingRoom) {
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
