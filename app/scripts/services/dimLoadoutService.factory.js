(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimLoadoutService', LoadoutService);

  LoadoutService.$inject = ['$q', '$rootScope', 'uuid2', 'dimItemService', 'dimStoreService', 'toaster', 'loadingTracker'];

  function LoadoutService($q, $rootScope, uuid2, dimItemService, dimStoreService, toaster, loadingTracker) {
    var _loadouts = [];

    return {
      dialogOpen: false,
      getLoadouts: getLoadouts,
      deleteLoadout: deleteLoadout,
      saveLoadouts: saveLoadouts,
      saveLoadout: saveLoadout,
      addItemToLoadout: addItemToLoadout,
      applyLoadout: applyLoadout,
      previousLoadouts: {} // by character ID
    };

    function addItemToLoadout(item) {
      $rootScope.$broadcast('dim-store-item-clicked', {
        item: item
      });
    }

    function processLoadout(data, version) {
      if (!_.isUndefined(data)) {
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
          // if (_.isUndefined(data['loadouts-v2.0'])) {
          //   chrome.storage.sync.get('loadouts', function(oldData) {
          //     processLoadout((oldData.loadouts) ? oldData.loadouts : undefined);
          //     saveLoadouts(_loadouts);
          //   })
          // } else {
          //   processLoadout((data['loadouts-v2.0']) ? data['loadouts-v2.0'] : undefined);
          // }

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

      if (!_.isUndefined(loadouts)) {
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
      var scope = {
        failed: false
      };

      var items = _.chain(loadout.items)
        .values()
        .flatten()
        .value();

      var _types = _.chain(items)
        .pluck('type')
        .uniq()
        .value();

      var _items = _.chain(store.items)
        .filter(function(item) {
          return _.contains(_types, item.type);
        })
        .filter(function(item) {
          return (!_.some(items, function(i) {
            return ((i.id === item.id) && (i.hash === item.hash));
          }));
        })
        .groupBy(function(item) {
          return item.type;
        })
        .value();

      return applyLoadoutItems(store, items, loadout, _items, scope);
    }

    function applyLoadoutItems(store, items, loadout, _items, scope) {
      if (items.length > 0) {
        var pseudoItem = items.splice(0, 1)[0];
        var item = dimItemService.getItem(pseudoItem);

        if (item.type === 'Class') {
          item = _.findWhere(store.items, {
            hash: pseudoItem.hash
          });
        }

        if (item) {
          var size = _.chain(store.items)
            .filter(function(i) {
              return item.type === i.type;
            })
            .size()
            .value();

          var p = $q.when(item);

          var target;

          if (size === 10) {
            if (item.owner !== store.id) {
              var moveItem = _items[item.type].splice(0, 1);
              p = $q.when(dimStoreService.getStores())
                .then(function(stores) {
                  return _.chain(stores)
                    .sortBy(function(s) {
                      if (s.id === store.id) {
                        return 0;
                      } else if (s.id === 'vault') {
                        return 2;
                      } else {
                        return 1;
                      }
                    })
                    .value();
                })
                .then(function(sortedStores) {
                  return _.find(sortedStores, function(s) {
                    return _.chain(s.items)
                      .filter(function(i) {
                        return item.type === i.type;
                      })
                      .size()
                      .value() < ((s.id === 'vault') ? 72 : 10);
                  });
                })
                .then(function(t) {
                  if (_.isUndefined(t)) {
                    throw new Error('Collector eh?  All your characters ' + moveItem[0].type.toLowerCase() + ' slots are full and I can\'t move items of characters, yet... Clear a slot on a character and I can complete the loadout.');
                  }
                  target = t;

                  return dimItemService.moveTo(moveItem[0], target);
                });
            }
          }

          var promise = p
            .then(function() {
              return dimItemService.moveTo(item, store, pseudoItem.equipped);
            })
            .catch(function(a) {
              scope.failed = true;
              toaster.pop('error', item.name, a.message);
            })
            .finally(function() {
              return applyLoadoutItems(store, items, loadout, _items, scope);
            });

          loadingTracker.addPromise(promise);
          return promise;
        } else {
          return $q.when();
        }
      } else {
        var dimStores;

        return $q.when(dimStoreService.getStores())
          .then(function(stores) {
            dimStores = dimStoreService.updateStores(stores);
          })
          .then(function() {
            var value = 'success';
            var message = 'Your loadout has been transfered.';

            if (scope.failed) {
              value = 'warning';
              message = 'Your loadout has been transfered, with errors.';
            }

            toaster.pop(value, loadout.name, message);
          });
      }
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
        var item = _.clone(dimItemService.getItem({
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

    function hydratev2d0(loadoutPrimitive) {
      var result = {
        id: loadoutPrimitive.id,
        name: loadoutPrimitive.name,
        classType: (_.isUndefined(loadoutPrimitive.classType) ? -1 : loadoutPrimitive.classType),
        version: 'v3.0',
        items: {}
      };

      _.each(loadoutPrimitive.items, function(itemPrimitive) {
        var item = _.clone(dimItemService.getItem({
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
        var item = _.clone(dimItemService.getItem(itemPrimitive));

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
        items: []
      };

      _.chain(loadout.items)
        .values()
        .flatten()
        .each(function(item) {
          result.items.push({
            id: item.id,
            hash: item.hash,
            amount: item.amount,
            equipped: item.equipped
          });
        });

      return result;
    }
  }
})();
