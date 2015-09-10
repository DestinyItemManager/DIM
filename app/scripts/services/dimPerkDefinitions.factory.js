(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimPerkDefinitions', PerkDefinitions);

    PerkDefinitions.$inject = ['$q', '$http'];

  function PerkDefinitions($q, $http) {
    var deferred = $q.defer();

    $http.get('scripts/api-manifest/perks.json?v=3.1.1')
      .then(function(data) {
        deferred.resolve(data);
      },
      function(data) {
        deferred.reject(new Error('The sandbox perk definition file was not parsed correctly.'));
      })
      .catch(function() {
        return new Error('The sandbox perk definition file was not parsed correctly.');
      });

    return {
      'getDefinitions': function() { return deferred.promise; }
    };
  }
})(angular);
