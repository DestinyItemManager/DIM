(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimLoadoutService', LoadoutService);


  LoadoutService.$inject = ['$q', '$rootScope', 'uuid2', 'dimItemService', 'dimStoreService', 'toaster', 'loadingTracker', 'dimPlatformService', 'SyncService', 'dimActionQueue'];
  function LoadoutService($q, $rootScope, uuid2, dimItemService, dimStoreService, toaster, loadingTracker, dimPlatformService, SyncService, dimActionQueue) {
    var _loadouts = [];

    return {
      dialogOpen: false,
      getLoadouts: getLoadouts,
      deleteLoadout: deleteLoadout,
      saveLoadout: saveLoadout,
      addItemToLoadout: addItemToLoadout,
      applyLoadout: applyLoadout,
      previousLoadouts: {} // by character ID
    };

    function addItemToLoadout(item, $event) {
      $rootScope.$broadcast('dim-store-item-clicked', {
        item: item,
        clickEvent: $event
      });
    }

    function processLoadout(data, version) {
      if (data) {
        if (version === 'v3.0') {
          var ids = data['loadouts-v3.0'];
          _loadouts.splice(0);

          _.each(ids, function(id) {
            _loadouts.push(hydrate(data[id]));
          });
        } else {
          _loadouts.splice(0);

          // Remove null loadouts.
          data = _.filter(data, function(primitive) {
            return !_.isNull(primitive);
          });

          _.each(data, function(primitive) {
            // Add id to loadout.
            _loadouts.push(hydrate(primitive));
          });
        }
      } else {
        _loadouts = _loadouts.splice(0);
      }
    }

    function getLoadouts(getLatest) {
      var deferred = $q.defer();
      var result = deferred.promise;

      // Avoids the hit going to data store if we have data already.
      if (getLatest || _.size(_loadouts) === 0) {
        SyncService.get().then(function(data) {
          if (_.has(data, 'loadouts-v3.0')) {
            processLoadout(data, 'v3.0');
          } else if (_.has(data, 'loadouts-v2.0')) {
            processLoadout(data['loadouts-v2.0'], 'v2.0');

            saveLoadouts(_loadouts);
          } else {
            processLoadout(undefined);
          }

          deferred.resolve(_loadouts);
        });
      } else {
        result = $q.when(_loadouts);
      }

      return result;
    }

    function saveLoadouts(loadouts) {
      var deferred = $q.defer();
      var result;

      if (loadouts) {
        result = $q.when(loadouts);
      } else {
        result = getLoadouts();
      }

      return result
        .then(function(loadouts) {
          _loadouts = loadouts;

          var loadoutPrimitives = _.map(loadouts, function(loadout) {
            return dehydrate(loadout);
          });

          var data = {
            'loadouts-v3.0': []
          };

          _.each(loadoutPrimitives, function(l) {
            data['loadouts-v3.0'].push(l.id);
            data[l.id] = l;
          });

          SyncService.set(data);

          deferred.resolve(loadoutPrimitives);

          return deferred.promise;
        });
    }

    function deleteLoadout(loadout) {
      return getLoadouts()
        .then(function(loadouts) {
          var index = _.findIndex(loadouts, function(l) {
            return (l.id === loadout.id);
          });

          if (index >= 0) {
            loadouts.splice(index, 1);
          }

          SyncService.remove(loadout.id.toString());

          return (loadouts);
        })
        .then(function(_loadouts) {
          return saveLoadouts(_loadouts);
        })
        .then(function(loadouts) {
          $rootScope.$broadcast('dim-delete-loadout', {
            loadout: loadout
          });

          return (loadouts);
        });
    }

    function saveLoadout(loadout) {
      return getLoadouts()
        .then(function(loadouts) {
          if (!_.has(loadout, 'id')) {
            loadout.id = uuid2.newguid();
          }

          // Handle overwriting an old loadout
          var existingLoadoutIndex = _.findIndex(loadouts, { id: loadout.id });
          if (existingLoadoutIndex > -1) {
            loadouts[existingLoadoutIndex] = loadout;
          } else {
            loadouts.push(loadout);
          }

          return saveLoadouts(loadouts);
        })
        .then(function(loadouts) {
          $rootScope.$broadcast('dim-save-loadout', {
            loadout: loadout
          });

          return (loadouts);
        });
    }

    function hydrate(loadout) {
      var hydration = {
        'v1.0': hydratev1d0,
        'v2.0': hydratev2d0,
        'v3.0': hydratev3d0,
        default: hydratev3d0
      };

      // v1.0 did not have a 'version' property so if it fails, we'll assume.
      return (hydration[(loadout.version)] || hydration['v1.0'])(loadout);
    }

    // A special getItem that takes into account the fact that
    // subclasses have unique IDs.
    function getLoadoutItem(pseudoItem, store) {
      var item = dimItemService.getItem(pseudoItem);
      if (item.type === 'Class') {
        item = _.find(store.items, {
          hash: pseudoItem.hash
        });
      }
      return item;
    }

    function applyLoadout(store, loadout) {
      return dimActionQueue.queueAction(function() {
        var items = angular.copy(_.flatten(_.values(loadout.items)));
        var totalItems = items.length;

        var loadoutItemIds = items.map(function(i) {
          return {
            id: i.id,
            hash: i.hash
          };
        });

        // Only select stuff that needs to change state
        items = _.filter(items, function(pseudoItem) {
          var item = getLoadoutItem(pseudoItem, store);
          return !item ||
            !item.equipment ||
            item.owner !== store.id ||
            item.equipped !== pseudoItem.equipped;
        });

        // vault can't equip
        if (store.isVault) {
          items.forEach(function(i) { i.equipped = false; });
        }

        // We'll equip these all in one go!
        var itemsToEquip = _.filter(items, 'equipped');
        if (itemsToEquip.length > 1) {
          // we'll use the equipItems function
          itemsToEquip.forEach(function(i) { i.equipped = false; });
        }

        // Stuff that's equipped on another character. We can bulk-dequip these
        var itemsToDequip = _.filter(items, function(pseudoItem) {
          var item = dimItemService.getItem(pseudoItem);
          return item.owner !== store.id && item.equipped;
        });

        var scope = {
          failed: 0,
          total: totalItems,
          successfulItems: []
        };

        var promise = $q.when();

        if (itemsToDequip.length > 1) {
          var realItemsToDequip = itemsToDequip.map(function(i) {
            return dimItemService.getItem(i);
          });
          var dequips = _.map(_.groupBy(realItemsToDequip, 'owner'), function(dequipItems, owner) {
            var equipItems = realItemsToDequip.map(function(i) {
              return dimItemService.getSimilarItem(i, loadoutItemIds);
            });
            return dimItemService.equipItems(dimStoreService.getStore(owner), equipItems);
          });
          promise = $q.all(dequips);
        }

        promise = promise
          .then(function() {
            return applyLoadoutItems(store, items, loadout, loadoutItemIds, scope);
          })
          .then(function() {
            if (itemsToEquip.length > 1) {
              // Use the bulk equipAll API to equip all at once.
              itemsToEquip = _.filter(itemsToEquip, function(i) {
                return _.find(scope.successfulItems, { id: i.id });
              });
              var realItemsToEquip = itemsToEquip.map(function(i) {
                return getLoadoutItem(i, store);
              });

              // Check for an equipped exotic without The Life Exotic
              // perk, which occupies a slot that won't be already
              // replaced with a loadout item, and remove
              // it. Otherwise, the bulk equip will fail because
              // Bungie doesn't unequip to make room for exotics.
              const exoticsToEquip = _.filter(realItemsToEquip, (i) => i.isExotic);
              const problemExotics = _.compact(exoticsToEquip.map((exotic) => {
                return _.find(store.items, (i) => {
                  return i.equipped &&
                    i.bucket.sort === exotic.sort &&
                    i.isExotic &&
                    !i.hasLifeExotic() &&
                    !_.find(realItemsToEquip, { type: i.type });
                });
              }));

              let fixProblemExotics = $q.when();
              if (problemExotics.length) {
                const similarItems = problemExotics.map((i) => dimItemService.getSimilarItem(i, loadoutItemIds));
                fixProblemExotics = dimItemService.equipItems(store, similarItems);
              }

              return fixProblemExotics.then(() => dimItemService.equipItems(store, realItemsToEquip));
            } else {
              return itemsToEquip;
            }
          })
          .then(function(equippedItems) {
            if (equippedItems.length < itemsToEquip.length) {
              var failedItems = _.filter(itemsToEquip, function(i) {
                return !_.find(equippedItems, { id: i.id });
              });
              failedItems.forEach(function(item) {
                scope.failed++;
                toaster.pop('error', loadout.name, 'Could not equip ' + item.name);
              });
            }
          })
          .then(function() {
            // We need to do this until https://github.com/DestinyItemManager/DIM/issues/323
            // is fixed on Bungie's end. When that happens, just remove this call.
            if (scope.successfulItems.length > 0) {
              return dimStoreService.updateCharacters();
            }
            return undefined;
          })
          .then(function() {
            var value = 'success';
            var message = 'Your loadout of ' + scope.total + ' items has been transferred to your ' + store.name + '.';

            if (scope.failed > 0) {
              if (scope.failed === scope.total) {
                value = 'error';
                message = 'None of the items in your loadout could be transferred.';
              } else {
                value = 'warning';
                message = 'Your loadout has been partially transferred, but ' + scope.failed + ' of ' + scope.total + ' items had errors.';
              }
            }

            toaster.pop(value, loadout.name, message);
          });

        loadingTracker.addPromise(promise);
        return promise;
      });
    }

    // Move one loadout item at a time. Called recursively to move items!
    function applyLoadoutItems(store, items, loadout, loadoutItemIds, scope) {
      if (items.length === 0) {
        // We're done!
        return $q.when();
      }

      var promise = $q.when();
      var pseudoItem = items.shift();
      var item = getLoadoutItem(pseudoItem, store);

      if (item.type === 'Material' || item.type === 'Consumable') {
        // handle consumables!
        var amountNeeded = pseudoItem.amount - store.amountOfItem(pseudoItem);
        if (amountNeeded > 0) {
          var otherStores = _.reject(dimStoreService.getStores(), function(otherStore) {
            return store.id === otherStore.id;
          });
          var storesByAmount = _.sortBy(otherStores.map(function(store) {
            return {
              store: store,
              amount: store.amountOfItem(pseudoItem)
            };
          }), 'amount').reverse();

          while (amountNeeded > 0) {
            var source = _.max(storesByAmount, 'amount');
            var amountToMove = Math.min(source.amount, amountNeeded);
            var sourceItem = _.findWhere(source.store.items, { hash: pseudoItem.hash });

            if (amountToMove === 0 || !sourceItem) {
              promise = promise.then(function() {
                return $q.reject(new Error("There's not enough " + item.name + " to fulfill your loadout."));
              });
              break;
            }

            source.amount -= amountToMove;
            amountNeeded -= amountToMove;

            promise = promise.then(function() {
              return dimItemService.moveTo(sourceItem, store, false, amountToMove);
            });
          }
        }
      } else {
        if (item.type === 'Class') {
          item = _.findWhere(store.items, {
            hash: pseudoItem.hash
          });
        }

        if (item) {
          // Pass in the list of items that shouldn't be moved away
          promise = dimItemService.moveTo(item, store, pseudoItem.equipped, item.amount, loadoutItemIds);
        } else {
          promise = $.reject(new Error(item.name + " doesn't exist in your account."));
        }
      }

      promise = promise
        .then(function() {
          scope.successfulItems.push(item);
        })
        .catch(function(e) {
          scope.failed++;
          if (e.message !== 'move-canceled') {
            toaster.pop('error', item.name, e.message);
          }
        })
        .finally(function() {
          // Keep going
          return applyLoadoutItems(store, items, loadout, loadoutItemIds, scope);
        });

      return promise;
    }

    function hydratev3d0(loadoutPrimitive) {
      var result = {
        id: loadoutPrimitive.id,
        name: loadoutPrimitive.name,
        platform: loadoutPrimitive.platform,
        classType: (_.isUndefined(loadoutPrimitive.classType) ? -1 : loadoutPrimitive.classType),
        version: 'v3.0',
        items: {}
      };

      _.each(loadoutPrimitive.items, function(itemPrimitive) {
        var item = angular.copy(dimItemService.getItem({
          id: itemPrimitive.id,
          hash: itemPrimitive.hash
        }));

        if (item) {
          var discriminator = item.type.toLowerCase();

          item.equipped = itemPrimitive.equipped;

          item.amount = itemPrimitive.amount;

          result.items[discriminator] = (result.items[discriminator] || []);
          result.items[discriminator].push(item);
        }
      });

      return result;
    }

    function hydratev2d0(loadoutPrimitive) {
      var result = {
        id: loadoutPrimitive.id,
        name: loadoutPrimitive.name,
        classType: (_.isUndefined(loadoutPrimitive.classType) ? -1 : loadoutPrimitive.classType),
        version: 'v3.0',
        items: {}
      };

      _.each(loadoutPrimitive.items, function(itemPrimitive) {
        var item = angular.copy(dimItemService.getItem({
          id: itemPrimitive.id,
          hash: itemPrimitive.hash
        }));

        if (item) {
          var discriminator = item.type.toLowerCase();

          item.equipped = itemPrimitive.equipped;

          result.items[discriminator] = (result.items[discriminator] || []);
          result.items[discriminator].push(item);
        }
      });

      return result;
    }

    function hydratev1d0(loadoutPrimitive) {
      var result = {
        id: uuid2.newguid(),
        name: loadoutPrimitive.name,
        classType: -1,
        version: 'v3.0',
        items: {}
      };

      _.each(loadoutPrimitive.items, function(itemPrimitive) {
        var item = angular.copy(dimItemService.getItem(itemPrimitive));

        if (item) {
          var discriminator = item.type.toLowerCase();

          result.items[discriminator] = (result.items[discriminator] || []);
          result.items[discriminator].push(item);

          item.equipped = true;
        }
      });

      return result;
    }

    function dehydrate(loadout) {
      var result = {
        id: loadout.id,
        name: loadout.name,
        classType: loadout.classType,
        version: 'v3.0',
        platform: loadout.platform,
        items: []
      };

      result.items = _.chain(loadout.items)
        .values()
        .flatten()
        .map(function(item) {
          return {
            id: item.id,
            hash: item.hash,
            amount: item.amount,
            equipped: item.equipped
          };
        })
        .value();

      return result;
    }
  }
})();
