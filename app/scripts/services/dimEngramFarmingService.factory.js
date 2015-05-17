(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimEngramFarmingService', engramFarmingService);

  engramFarmingService.$inject = ['$q', '$interval', 'dimStoreService', 'dimItemService'];

  function engramFarmingService($q, $interval, dimStoreService, dimItemService) {
    var farmingInterval,
        farmingCharacterId,
        moving;

    function checkForEngrams() {
      if (moving) {
        return;
      }

      dimStoreService.getStores(/* get from server */true)
        .then(function(stores) {
          var characterStore = _.findWhere(stores, { id: farmingCharacterId }),
              engrams = _.filter(characterStore.items, function(item) {
                return item.name.toLowerCase().indexOf('engram') >= 0;
              });

          if (engrams.length > 0) {
            moving = true;
            moveEngrams(engrams)
              .finally(function() { moving  = false; });
          }
        });
    }

    function moveEngram(engram) {
      var candidateStores = _.reject(dimStoreService.getStores(), { id: farmingCharacterId });

      return dimItemService.moveTo(engram, candidateStores[0])
        .catch(function() {
          return dimItemService.moveTo(engram, candidateStores[1]);
        })
        .catch(function() {
          return dimItemService.moveTo(engram, candidateStores[2]);
        });
    }

    function moveEngrams(engrams) {
      var thisCharacterId = farmingCharacterId; // Store farming character
                                                // id in case it changes
                                                // while we are working on
                                                // engrams.

      if (engrams.length === 0) {
        return $q.when(null);
      }

      var engramToMove = _.head(engrams),
          otherEngrams = _.tail(engrams);

      return moveEngram(engramToMove)
        .then(function() {
          if (farmingCharacterId !== thisCharacterId) {
            return $q.when(null);
          }

          return moveEngrams(otherEngrams);
        });
    }

    function startFarming() {
      $interval.cancel(farmingInterval);

      checkForEngrams();
      farmingInterval = $interval(checkForEngrams, 5000);
    }

    function stopFarming() {
      farmingCharacterId = undefined;
      $interval.cancel(farmingInterval);
    }

    return {
      'farmingEnabledFor': function(characterId) {
        return farmingCharacterId === characterId;
      },
      'toggleFarmingFor': function(characterId) {
        if (farmingCharacterId !== characterId) {
          farmingCharacterId = characterId;
          startFarming();
        } else {
          farmingCharacterId = undefined;
          stopFarming();
        }
      }
    };
  }
})(angular);
