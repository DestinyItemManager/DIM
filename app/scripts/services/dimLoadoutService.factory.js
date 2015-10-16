(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimLoadoutService', LoadoutService);

  LoadoutService.$inject = ['$q', '$rootScope', 'uuid2', 'dimItemService', 'SyncService'];

  function LoadoutService($q, $rootScope, uuid2, dimItemService, SyncService) {
    var _loadouts = [];

    return {
      'dialogOpen': false,
      'getLoadouts': getLoadouts,
      'deleteLoadout': deleteLoadout,
      'saveLoadouts': saveLoadouts,
      'saveLoadout': saveLoadout,
      'addItemToLoadout': addItemToLoadout
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
        SyncService.get().then(function(data) {
          // if (_.isUndefined(data['loadouts-v2.0'])) {
          //   SyncService.get('loadouts').then(function(oldData) {
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

          return _.map(loadouts, function(loadout) {
            return dehydrate(loadout);
          });
        })
        .then(function(loadoutPrimitives) {
          var data = {
            'loadouts-v3.0': []
          };

          _.each(loadoutPrimitives, function(l) {
            data['loadouts-v3.0'].push(l.id);
            data[l.id] = l;
          });

          console.log('saving', data);
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

          loadouts.push(loadout);

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
      }

      // v1.0 did not have a 'version' property so if it fails, we'll assume.
      return (hydration[(loadout.version)] || hydration['v1.0'])(loadout);
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
