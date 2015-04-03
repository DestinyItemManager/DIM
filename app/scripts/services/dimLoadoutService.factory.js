(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimLoadoutService', LoadoutService);

  LoadoutService.$inject = ['chromeStorage', '$q', '$rootScope'];

  function LoadoutService(chromeStorage, $q, $rootScope) {
    var _loadouts = [];

    return {
      'getLoadouts': getLoadouts,
      'deleteLoadout': deleteLoadout,
      'saveLoadout': saveLoadout
    };

    function getLoadouts(getLatest) {
      var result;

      if (getLatest || _.size(_loadouts) === 0) {
        result = chromeStorage.get('loadouts')
          .then(function (loadouts) {
            if (!_.isUndefined(loadouts)) {
              _loadouts.splice(0);
              loadouts = _.filter(loadouts, function(loadout) {
                return !_.isNull(loadout);
              });

              _loadouts = _loadouts.concat(loadouts);

              _.each(_loadouts, function (loadout) {
                if (!_.isNull(loadout)) {
                  if (!_.has(loadout, 'id')) {
                    loadout.id = _.reduce(loadouts, function (memo, loadout) {
                      return (_.has(loadout, 'id') ? Math.max(loadout.id, memo) : memo);
                    }, 0) + 1;
                  }
                }
              });
            } else {
              _loadouts.splice(0);
            }

            return _loadouts;
          });
      } else {
        result = $q.when(_loadouts);
      }

      return result;
    }

    function saveLoadouts(loadouts) {
      var result;

      if (!_.isUndefined(loadouts)) {
        result = $q.when(loadouts);
      } else {
        result = getLoadouts();
      }

      return result
        .then(function (pLoadouts) {
          chromeStorage.set('loadouts', pLoadouts);
          _loadouts = pLoadouts;

          return pLoadouts;
        });
    }

    function deleteLoadout(loadout) {
      return getLoadouts()
        .then(function (loadouts) {
          var index = _.findIndex(loadouts, function (l) {
            return (l.id === loadout.id);
          });

          if (index >= 0) {
            loadouts.splice(index, 1);
          }

          return (loadouts);
        })
        .then(function (_loadouts) {
          return saveLoadouts(_loadouts);
        })
        .then(function (loadouts) {
          $rootScope.$broadcast('dim-delete-loadout', {
            loadout: loadout
          });

          return (loadouts);
        });
    }

    function saveLoadout(loadout) {
      return getLoadouts()
        .then(function (loadouts) {
          if (!_.has(loadout, 'id')) {
            loadout.id = _.reduce(loadouts, function (memo, loadout) {
              return (_.has(loadout, 'id') ? Math.max(loadout.id, memo) : memo);
            }, 0) + 1;
          }

          loadouts.push(loadout);

          return saveLoadouts(loadouts);
        })
        .then(function (loadouts) {
          $rootScope.$broadcast('dim-save-loadout', {
            loadout: loadout
          });

          return (loadouts);
        });
    }
  }
})();
