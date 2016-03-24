(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimLoadoutService', LoadoutService);

  LoadoutService.$inject = ['$q', '$rootScope', 'uuid2', 'dimItemService', 'dimStoreService', 'toaster', 'loadingTracker', 'dimPlatformService'];

  function LoadoutService($q, $rootScope, uuid2, dimItemService, dimStoreService, toaster, loadingTracker, dimPlatformService) {
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
        chrome.storage.sync.get(null, function(data) {
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

      return result.then(function(loadouts) {
        // Filter to current platform
        var platform = dimPlatformService.getActive();
        return _.filter(loadouts, function(loadout) {
          return loadout.platform === undefined || loadout.platform === platform.label; // Playstation or Xbox
        });
      });
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

          chrome.storage.sync.set(data, function(e) {
            deferred.resolve(loadoutPrimitives);
          });

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

          chrome.storage.sync.remove(loadout.id.toString(), function() {});

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
          var existingLoadoutIndex = _.findIndex(loadouts, {id: loadout.id});
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
      var result;
      var hydration = {
        'v1.0': hydratev1d0,
        'v2.0': hydratev2d0,
        'v3.0': hydratev3d0,
        'default': hydratev3d0
      };

      // v1.0 did not have a 'version' property so if it fails, we'll assume.
      return (hydration[(loadout.version)] || hydration['v1.0'])(loadout);
    }

    function applyLoadout(store, loadout) {
      var items = _.flatten(_.values(loadout.items));

      var _types = _.uniq(_.pluck(items, 'type'));

      var loadoutItemIds = items.map(function(i) {
        return {
          id: i.id,
          hash: i.hash
        };
      });

      var scope = {
        failed: 0,
        total: items.length
      };
      return applyLoadoutItems(store, items, loadout, loadoutItemIds, scope);
    }

    // Move one loadout item at a time. Called recursively to move items!
    function applyLoadoutItems(store, items, loadout, loadoutItemIds, scope) {
      if (items.length == 0) {
        // We're done!
        return dimStoreService.updateCharacters()
          .then(function() {
            var value = 'success';
            var message = 'Your loadout of ' + scope.total + ' items has been transfered.';

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
      }

      var promise = $q.when();
      var pseudoItem = items.shift();
      var item = dimItemService.getItem(pseudoItem);

      if (item.type === 'Material' || item.type === 'Consumable') {
        // handle consumables!
        var amountNeeded = pseudoItem.amount - store.amountOfItem(pseudoItem);
        if (amountNeeded > 0) {
          var otherStores = _.reject(dimStoreService.getStores(), function(otherStore) {
            return store.id == otherStore.id;
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
          var size = _.where(store.items, { type: item.type }).length;

          // If full, make room.
          if (size >= store.capacityForItem(item)) {
            if (item.owner !== store.id) {
              // Pass in the list of items that shouldn't be moved away
              promise = dimItemService.makeRoomForItem(item, store, loadoutItemIds);
            }
          }

          promise = promise.then(function() {
            return dimItemService.moveTo(item, store, pseudoItem.equipped);
          });
        } else {
          promise = $.reject(new Error(item.name + " doesn't exist in your account."));
        }
      }

      promise = promise
        .catch(function(e) {
          scope.failed++;
          toaster.pop('error', item.name, e.message);
        })
        .finally(function() {
          // Keep going
          return applyLoadoutItems(store, items, loadout, loadoutItemIds, scope);
        });

      loadingTracker.addPromise(promise);
      return promise;
    }

    function hydratev3d0(loadoutPrimitive) {
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
