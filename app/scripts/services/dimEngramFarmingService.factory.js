(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimEngramFarmingService', EngramFarmingService);

  EngramFarmingService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimItemService', 'dimStoreService', '$interval', 'toaster'];

  function EngramFarmingService($rootScope, $q, dimBungieService, dimItemService, dimStoreService, $interval, toaster) {
    var intervalId;

    function moveItemsToVault(items) {
      var vault = dimStoreService.getVault();
      return $q.all(items.map(function(item) {
        return dimItemService.moveTo(item, vault, false, item.amount)
          .then(function() {
            self.engramsMoved++;
          })
          .catch(function(e) {
            toaster.pop('error', item.name, e.message);
          });
      }));
    }

    return {
      active: false,
      store: null,
      engramsMoved: 0,
      movingEngrams: false,
      makingRoom: false,
      // Move all engrams on the selected character to the vault.
      moveEngramsToVault: function() {
        var self = this;
        var store = dimStoreService.getStore(self.store.id);
        var engrams = _.select(store.items, function(i) {
          return i.isEngram() && i.sort !== 'Postmaster';
        });

        if (engrams.length === 0) {
          console.log("Nothing to move away.");
          return $q.resolve();
        }

        self.movingEngrams = true;
        return moveItemsToVault(engrams)
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

        if (itemsToMove.length) {
          self.makingRoom = true;
          return moveItemsToVault(itemsToMove)
            .finally(function() {
              self.makingRoom = false;
            });
        } else {
          return $q.resolve();
        }
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
            dimStoreService.reloadStores().then(function(stores) {
              console.log("FARM");

              return self.moveEngramsToVault().then(function() {
                self.makeRoomForEngrams();
              });
            });
          }
          intervalId = $interval(farm, 60000);
          farm();
        }
      },
      stop: function() {
        if (intervalId) {
          console.log("STOP FARM");
          $interval.cancel(intervalId);
        }
        this.active = false;
      }
    };
  }
})();
