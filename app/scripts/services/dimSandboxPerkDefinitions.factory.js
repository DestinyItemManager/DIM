(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimSandboxPerkDefinitions', dimSandboxPerkDefinitions);

    dimSandboxPerkDefinitions.$inject = ['$q', '$http'];

  function dimSandboxPerkDefinitions($q, $http) {
    var deferred = $q.defer();

    $http.get('scripts/api-manifest/perks.json?v=3.1.11')
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
