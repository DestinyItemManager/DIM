(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimLoadoutService', LoadoutService);

  LoadoutService.$inject = ['$q', '$rootScope', 'uuid2', 'dimItemService'];

  function LoadoutService($q, $rootScope, uuid2, dimItemService) {
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

    function processLoadout(data) {
      if (!_.isUndefined(data)) {
        _loadouts.splice(0);

        // Remove null loadouts.
        data = _.filter(data, function(primitive) {
          return !_.isNull(primitive);
        });

        _.each(data, function(primitive) {
          // Add id to loadout.
          _loadouts.push(hydrate(primitive));
        });
      } else {
        _loadouts = _loadouts.splice(0);
      }
    }

    function getLoadouts(getLatest) {
      var deferred = $q.defer();
      var result = deferred.promise;

      // Avoids the hit going to data store if we have data already.
      if (getLatest || _.size(_loadouts) === 0) {
        chrome.storage.sync.get('loadouts-v2.0', function(data) {
          if (_.isUndefined(data['loadouts-v2.0'])) {
            chrome.storage.sync.get('loadouts', function(oldData) {
              processLoadout((oldData.loadouts) ? oldData.loadouts : undefined);
              saveLoadouts(_loadouts);
            })
          } else {
            processLoadout((data['loadouts-v2.0']) ? data['loadouts-v2.0'] : undefined);
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
          chrome.storage.sync.set({ 'loadouts-v2.0': loadoutPrimitives }, function(e) {
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
        'default': hydratev2d0
      }

      // v1.0 did not have a 'version' property so if it fails, we'll assume.
      return (hydration[(loadout.version)] || hydration['v1.0'])(loadout);
    }

    function hydratev2d0(loadoutPrimitive) {
      var result = {
        id: loadoutPrimitive.id,
        name: loadoutPrimitive.name,
        classType: (_.isUndefined(loadoutPrimitive.classType) ? -1 : loadoutPrimitive.classType),
        version: 'v2.0',
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
        version: 'v2.0',
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
        version: 'v2.0',
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
