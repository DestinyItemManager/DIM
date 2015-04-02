(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimLoadoutService', LoadoutService);

  LoadoutService.$inject = ['chromeStorage'];

  function LoadoutService(chromeStorage) {
    return {
      'getLoadouts': getLoadouts,
      'saveLoadout': saveLoadout
    };

    function getLoadouts() {
      return chromeStorage.get('loadouts');
    }

    function saveLoadouts(loadouts) {
      chromeStorage.set('loadouts', loadouts);
    }

    function saveLoadout(loadout) {
      chromeStorage.get('loadouts')
        .then(function (loadouts) {
          loadouts = loadouts || [];
          loadouts.push(loadout);

          chromeStorage.set('loadouts', loadouts);
        });
    }
  }
})();
