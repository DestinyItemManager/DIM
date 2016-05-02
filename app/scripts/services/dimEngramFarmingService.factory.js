(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimEngramFarmingService', EngramFarmingService);

  EngramFarmingService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimItemService', 'dimStoreService', '$interval', 'toaster'];

  /**
   * A service for "farming" engrams by moving them continuously off a character,
   * so that they don't go to the Postmaster.
   */
  function EngramFarmingService($rootScope, $q, dimBungieService, dimItemService, dimStoreService, $interval, toaster) {
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
        var vault = dimStoreService.getVault();
        return _.reduce(items, function(promise, item) {
          return promise
            .then(function() {
              return dimItemService.moveTo(item, vault, false, item.amount, items);
            })
            .then(function() {
              if (incrementCounter) {
                // TODO: whoops
                self.engramsMoved++;
              }
            });
        }, $q.resolve())
          .catch(function(e) {
            toaster.pop('error', item.name, e.message);
          });
      },
      moveEngramsToVault: function() {
        var self = this;
        var store = dimStoreService.getStore(self.store.id);
        var engrams = _.select(store.items, function(i) {
          return i.isEngram() && i.sort !== 'Postmaster';
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
            !i.notransfer &&
            i.sort !== 'Postmaster' &&
            _.contains(engramTypes, i.type);
        });
        var itemsByType = _.groupBy(applicableItems, 'type');

        // If any category is full, we'll move one aside
        var itemsToMove = [];
        _.each(itemsByType, function(items, type) {
          // subtract 1 from capacity because we excluded the equipped item
          if (items.length > 0 && items.length >= (store.capacityForItem(items[0]) - 1)) {
            // We'll move the lowest-value item to the vault.
            itemsToMove.push(_.min(items, function(i) {
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
        if (!this.active) {
          this.active = true;
          this.store = store;
          this.engramsMoved = 0;
          this.movingEngrams = false;
          this.makingRoom = false;
          var self = this;

          function farm() {
            self.moveEngramsToVault().then(function() {
              self.makeRoomForEngrams();
            });
          }

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
